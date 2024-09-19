"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingFile = exports.defaultPluginOptions = void 0;
const path_1 = __importDefault(require("path"));
const unist_util_select_1 = require("unist-util-select");
const lodash_1 = require("lodash");
const cheerio_1 = __importDefault(require("cheerio"));
const utils_1 = require("./utils");
exports.defaultPluginOptions = {
    staticFolderName: 'static',
    include: [],
    exclude: [],
};
const findMatchingFile = (src, files, options) => {
    const result = (0, lodash_1.find)(files, (file) => {
        const staticPath = (0, utils_1.slash)(path_1.default.join(options.staticFolderName, src));
        return (0, utils_1.slash)(path_1.default.normalize(file.absolutePath)).endsWith(staticPath);
    });
    if (!result) {
        throw new Error(`No matching file found for src "${src}" in static folder "${options.staticFolderName}". Please check static folder name and that file exists at "${options.staticFolderName}${src}". This error will probably cause a "GraphQLDocumentError" later in build. All converted field paths MUST resolve to a matching file in the "static" folder.`);
    }
    return result;
};
exports.findMatchingFile = findMatchingFile;
exports.default = ({ files, markdownNode, markdownAST }, pluginOptions) => __awaiter(void 0, void 0, void 0, function* () {
    // Default options
    const options = (0, lodash_1.defaults)(pluginOptions, exports.defaultPluginOptions);
    if (!markdownNode.fileAbsolutePath)
        return;
    const directory = path_1.default.dirname(markdownNode.fileAbsolutePath);
    // Process all markdown image nodes
    (0, unist_util_select_1.selectAll)('image', markdownAST).forEach((_node) => {
        const node = _node;
        if (!(0, lodash_1.isString)(node.url))
            return;
        if (!path_1.default.isAbsolute(node.url) || !path_1.default.extname(node.url))
            return;
        const file = (0, exports.findMatchingFile)(node.url, files, options);
        // Update node.url to be relative to its parent file
        node.url = path_1.default.relative(directory, file.absolutePath);
    });
    // Process all HTML images in markdown body
    (0, unist_util_select_1.selectAll)('html', markdownAST).forEach((_node) => {
        const node = _node;
        const $ = cheerio_1.default.load(node.value);
        if ($(`img`).length === 0)
            return;
        $(`img`).each((_, element) => {
            var _a;
            // Get the details we need.
            const url = $(element).attr(`src`);
            // Only handle absolute (local) urls
            if (!(0, lodash_1.isString)(url))
                return;
            if (!path_1.default.isAbsolute(url) || !path_1.default.extname(url))
                return;
            const file = (0, exports.findMatchingFile)(url, files, options);
            // Make the image src relative to its parent node
            const src = path_1.default.relative(directory, file.absolutePath);
            $(element).attr('src', src);
            node.value = (_a = $(`body`).html()) !== null && _a !== void 0 ? _a : ''; // fix for cheerio v1
        });
    });
});
