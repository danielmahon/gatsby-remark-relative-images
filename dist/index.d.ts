export type GatsbyNodePluginArgs = {
    files: GatsbyFile[];
    markdownNode: MarkdownNode;
    markdownAST: any;
    reporter: {
        info: (msg: string, error?: Error) => void;
    };
};
export type GatsbyFile = {
    absolutePath: string;
};
export type PluginOptions = {
    staticFolderName: string;
    include: string[];
    exclude: string[];
};
export type FrontMatterOptions = {
    staticFolderName: string;
    include: string[];
    exclude: string[];
};
export type MarkdownNode = {
    id: string;
    parent: string;
    url: string;
    frontmatter?: object;
    internal: {
        type: string;
    };
    fileAbsolutePath: string;
};
export type Node = {
    dir: string;
};
export type HtmlNode = {
    value: string;
} & MarkdownNode;
export declare const defaultPluginOptions: {
    staticFolderName: string;
    include: never[];
    exclude: never[];
};
export declare const findMatchingFile: (src: string, files: GatsbyFile[], options: PluginOptions) => GatsbyFile;
declare const _default: ({ files, markdownNode, markdownAST }: GatsbyNodePluginArgs, pluginOptions: PluginOptions) => Promise<void>;
export default _default;
