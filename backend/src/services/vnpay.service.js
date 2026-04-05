/**
 * VNPay Service
 * Xử lý tất cả logic liên quan đến VNPay:
 * - Tạo URL thanh toán
 * - Verify return/IPN signature
 * - Refund (hoàn tiền)
 *
 * Tài liệu: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
 *
 * ENV vars dùng:
 *   VNP_TMNCODE      - Mã TM (Terminal Merchant Code)
 *   VNP_HASHSECRET   - Khóa bí mật để tạo/xác thực hash
 *   VNP_URL          - URL cổng thanh toán VNPay
 *   VNP_RETURN       - URL callback sau khi user thanh toán xong
 *   IPN_URL          - URL VNPay gọi ngầm (server-to-server)
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('qs');

const TMN_CODE = process.env.VNP_TMNCODE;
const SECRET = process.env.VNP_HASHSECRET;
const VNP_URL = process.env.VNP_URL;
const RETURN_URL = process.env.VNP_RETURN;

/** Lấy ngày giờ theo format VNP: YYYYMMDDHHmmss */
function vnpDate(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const mo = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}${mo}${d}${h}${mi}${s}`;
}

/** Tạo HMAC-SHA512 signature */
function createSignature(sortedParams) {
    const signData = querystring.stringify(sortedParams, { encode: false });
    return crypto
        .createHmac('sha512', SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
}

/**
 * Tạo URL thanh toán VNPay
 * @param {string} txnRef      - Mã giao dịch duy nhất (vnp_txn_ref, thường là paymentId)
 * @param {number} amount      - Số tiền (VND, chưa nhân 100)
 * @param {string} ipAddr      - IP của client
 * @param {string} orderInfo   - Mô tả đơn hàng
 * @returns {string}           - URL để redirect user
 */
exports.createPaymentUrl = (txnRef, amount, ipAddr, orderInfo = 'Thanh toan dat lich kham') => {
    const now = new Date();
    // VNPay yêu cầu expires 15 phút sau
    const expires = new Date(now.getTime() + 15 * 60 * 1000);

    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: TMN_CODE,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(amount * 100), // VNPay nhân 100
        vnp_ReturnUrl: RETURN_URL,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_CreateDate: vnpDate(now),
        vnp_ExpireDate: vnpDate(expires),
    };

    // Sắp xếp tham số theo alphabet (bắt buộc của VNPay)
    const sorted = Object.keys(params).sort().reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
    }, {});

    sorted.vnp_SecureHash = createSignature(sorted);

    return `${VNP_URL}?${querystring.stringify(sorted, { encode: false })}`;
};

/**
 * Xác thực chữ ký từ VNPay Return URL (GET query string)
 * @param {object} query - req.query từ VNPay redirect về
 * @returns {{ valid: boolean, responseCode: string, txnRef: string, transactionNo: string, bankCode: string }}
 */
exports.verifyReturn = (query) => {
    const signatureFromVnp = query.vnp_SecureHash;

    // Loại bỏ vnp_SecureHash và vnp_SecureHashType trước khi tính lại
    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // Sắp xếp và tính hash
    const sorted = Object.keys(params).sort().reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
    }, {});

    const expectedHash = createSignature(sorted);
    const valid = expectedHash === signatureFromVnp;

    return {
        valid,
        responseCode: query.vnp_ResponseCode,
        txnRef: query.vnp_TxnRef,
        transactionNo: query.vnp_TransactionNo,
        bankCode: query.vnp_BankCode,
        amount: parseInt(query.vnp_Amount, 10) / 100,
    };
};

/**
 * Xác thực chữ ký IPN (giống verifyReturn nhưng thêm check amount)
 * @param {object} query - body/query từ IPN call
 * @returns {{ valid: boolean, responseCode: string, txnRef: string, transactionNo: string, bankCode: string, amount: number }}
 */
exports.verifyIpn = (query) => {
    return exports.verifyReturn(query);
};

/**
 * Hoàn tiền qua VNPay Refund API
 * VNPay yêu cầu gọi API server-to-server (HTTPS POST JSON)
 *
 * @param {string} txnRef         - vnp_TxnRef của giao dịch gốc
 * @param {string} transactionNo  - vnp_TransactionNo nhận từ VNPay
 * @param {number} amount         - Số tiền hoàn (VND, chưa nhân 100)
 * @param {string} transactionDate - Ngày giao dịch gốc (format YYYYMMDDHHmmss)
 * @param {string} user           - Người thực hiện refund (để ghi log VNPay)
 * @returns {Promise<object>}     - Response từ VNPay
 */
exports.refund = async (txnRef, transactionNo, amount, transactionDate, user = 'system') => {
    const now = new Date();
    const reqId = `${Date.now()}`; // unique request id

    const body = {
        vnp_RequestId: reqId,
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: TMN_CODE,
        vnp_TransactionType: '02', // 02 = hoàn toàn bộ
        vnp_TxnRef: txnRef,
        vnp_Amount: Math.round(amount * 100),
        vnp_OrderInfo: `Hoan tien for ${txnRef}`,
        vnp_TransactionNo: transactionNo,
        vnp_TransactionDate: transactionDate,
        vnp_CreateBy: user,
        vnp_CreateDate: vnpDate(now),
        vnp_IpAddr: '127.0.0.1',
    };

    // Tạo hash cho refund: requestId|version|command|tmnCode|txnType|txnRef|amount|transactionNo|transactionDate|createBy|createDate|ipAddr|orderInfo
    const hashData = [
        body.vnp_RequestId,
        body.vnp_Version,
        body.vnp_Command,
        body.vnp_TmnCode,
        body.vnp_TransactionType,
        body.vnp_TxnRef,
        body.vnp_Amount,
        body.vnp_TransactionNo,
        body.vnp_TransactionDate,
        body.vnp_CreateBy,
        body.vnp_CreateDate,
        body.vnp_IpAddr,
        body.vnp_OrderInfo,
    ].join('|');

    body.vnp_SecureHash = crypto
        .createHmac('sha512', SECRET)
        .update(Buffer.from(hashData, 'utf-8'))
        .digest('hex');

    const REFUND_URL = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = https.request(REFUND_URL, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve({ raw: data }); }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
};
