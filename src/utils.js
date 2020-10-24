const crypto = require('crypto');

module.exports.arraysEqual = (a1, a2) => {
    return a1.length == a2.length && a1.every((v, i) => v === a2[i])
}

module.exports.generateHashCode = (str) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
}