"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCreateNode = void 0;
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const traverse_1 = __importDefault(require("traverse"));
const _1 = require(".");
const utils_1 = require("./utils");
const onCreateNode = ({ node, getNodesByType, actions }, pluginOptions) => {
    const options = (0, lodash_1.defaults)(pluginOptions, _1.defaultPluginOptions);
    const { createNodeField } = actions;
    if ((node.fileAbsolutePath && node.internal.type === `MarkdownRemark`) ||
        node.internal.type === `Mdx`) {
        // Filter out files that don't have an absolute path
        const files = getNodesByType(`File`).filter((file) => file.absolutePath);
        const directory = path_1.default.dirname(node.fileAbsolutePath);
        // Deeply iterate through frontmatter data for absolute paths
        (0, traverse_1.default)(node.frontmatter).forEach(function (value) {
            if (!(0, lodash_1.isString)(value))
                return;
            if (!path_1.default.isAbsolute(value) || !path_1.default.extname(value))
                return;
            const paths = this.path.reduce((acc, current) => {
                acc.push(acc.length > 0 ? [acc, current].join('.') : current);
                return acc;
            }, []);
            let shouldTransform = options.include.length < 1;
            if (options.include.some((a) => paths.includes(a))) {
                shouldTransform = true;
            }
            if (options.exclude.some((a) => paths.includes(a))) {
                shouldTransform = false;
            }
            if (!shouldTransform)
                return;
            const file = (0, _1.findMatchingFile)(value, files, options);
            if (!file || typeof file.absolutePath !== 'string') {
                console.error('Invalid file or file.absolutePath is not a string', file);
                return; // Skip this iteration or handle this case as appropriate
            }
            const newValue = (0, utils_1.slash)(path_1.default.relative(directory, file.absolutePath));
            if (newValue)
                this.update(newValue);
            createNodeField({
                node,
                name: `frontmatter`,
                value: node.frontmatter,
            });
        });
    }
};
exports.onCreateNode = onCreateNode;
