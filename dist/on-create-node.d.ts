import { PluginOptions, GatsbyFile, MarkdownNode } from '.';
export type GatsbyPluginArgs = {
    node: MarkdownNode;
    getNodesByType: (type: string) => GatsbyFile[];
    reporter: {
        info: (msg: string, error?: Error) => void;
    };
    actions: {
        createNodeField: (args: {
            node: MarkdownNode;
            name: string;
            value: any;
        }) => void;
    };
};
export declare const onCreateNode: ({ node, getNodesByType, actions }: GatsbyPluginArgs, pluginOptions: PluginOptions) => void;
