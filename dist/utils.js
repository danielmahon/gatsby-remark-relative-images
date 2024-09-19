"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slash = void 0;
const slash = (path) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    if (isExtendedLengthPath) {
        return path;
    }
    return path.replace(/\\/g, `/`);
};
exports.slash = slash;
