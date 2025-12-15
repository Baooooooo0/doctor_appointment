const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  //middleware bat req
  return (req, res, next) => {
    //Lấy JWT token từ header Authorization theo chuẩn Bearer
    const authHeader = req.headers.authorization;

    //neu header authorization hop le thi lay token neu khong thi tra ve 401
    if (!authHeader) return res.sendStatus(401);

    //"Bearer eyJhbGciOiJIUzI1NiIs...".split(' ') -> ["Bearer", "eyJhbGciOiJIUzI1NiIs..."] -> ["0", "1"] -> lay 1
    const token = authHeader.split(' ')[1];

    //try catch bat loi token hoac secret
    try {
      //kiem tra token co hop le khong (dung chu ky?, con han?) va giai ma token (decoded)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      //kiem tra role.length va middleware co yeu cau role khong?
      // auth(['admin']) -> roles.length > 0 hoac auth() -> roles.length === 0
      //roles = ['admin'] nhung decoded.role = 'user'
      if (roles.length && !roles.includes(decoded.role)) {
        return res.sendStatus(403); //tra 403 vi user da dang nhap (token hop le) nhung khong du quyen
      }
      req.user = decoded; //gan user vao req de controller khong can decoded lai token 
      next(); //neu token hop le va role hope le thi vao controller
    } catch {
      res.sendStatus(401); //neu ko hop le tra ve unauthorize coi nhu chua dang nhap 
    }
  };
};
