import path from 'path';
import { selectAll } from 'unist-util-select';
import { defaults, isString, find } from 'lodash';
import cheerio from 'cheerio';
import { slash } from './utils';
import { GatsbyNode } from 'gatsby';

export type GatsbyNodePluginArgs = {
  files: GatsbyFile[];
  markdownNode: MarkdownNode;
  markdownAST: any;
  reporter: {
    info: (msg: string, error?: Error) => void;
  };
  getNode: (id: string) => GatsbyNode;
};

export type GatsbyFile = {
  absolutePath: string;
};

export interface ResolveNodeArgs {
  node: GatsbyNode;
  getNode: (id: string) => GatsbyNode;
}
export type ResolveNodeFunc = (args: ResolveNodeArgs) => string;

export type PluginOptions = {
  staticFolderName: string;
  include: string[];
  exclude: string[];
  resolveNodePath?: ResolveNodeFunc;
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

export const defaultPluginOptions = {
  staticFolderName: 'static',
  include: [],
  exclude: [],
};

export const findMatchingFile = (
  src: string,
  files: GatsbyFile[],
  options: PluginOptions
) => {
  const result = find(files, (file) => {
    const staticPath = slash(path.join(options.staticFolderName, src));
    return slash(path.normalize(file.absolutePath)).endsWith(staticPath);
  });
  if (!result) {
    throw new Error(
      `No matching file found for src "${src}" in static folder "${options.staticFolderName}". Please check static folder name and that file exists at "${options.staticFolderName}${src}". This error will probably cause a "GraphQLDocumentError" later in build. All converted field paths MUST resolve to a matching file in the "static" folder.`
    );
  }
  return result;
};

export default async (
  { files, markdownNode, markdownAST, getNode }: GatsbyNodePluginArgs,
  pluginOptions: PluginOptions
) => {
  // Default options
  const options = defaults(pluginOptions, defaultPluginOptions);

  let fileAbsolutePath = markdownNode.fileAbsolutePath;

  if (!fileAbsolutePath && pluginOptions.resolveNodePath) {
    fileAbsolutePath = pluginOptions.resolveNodePath({
      node: markdownNode,
      getNode,
    });
  }
  if (!fileAbsolutePath) return;

  const directory = path.dirname(fileAbsolutePath);

  // Process all markdown image nodes
  selectAll('image', markdownAST).forEach((_node: any) => {
    const node = _node as MarkdownNode;
    if (!isString(node.url)) return;
    if (!path.isAbsolute(node.url) || !path.extname(node.url)) return;

    const file = findMatchingFile(node.url, files, options);

    // Update node.url to be relative to its parent file
    node.url = path.relative(directory, file.absolutePath);
  });

  // Process all HTML images in markdown body
  selectAll('html', markdownAST).forEach((_node: any) => {
    const node = _node as HtmlNode;

    const $ = cheerio.load(node.value);

    if ($(`img`).length === 0) return;

    $(`img`).each((_, element) => {
      // Get the details we need.
      const url = $(element).attr(`src`);

      // Only handle absolute (local) urls
      if (!isString(url)) return;
      if (!path.isAbsolute(url) || !path.extname(url)) return;

      const file = findMatchingFile(url, files, options);

      // Make the image src relative to its parent node
      const src = path.relative(directory, file.absolutePath);
      $(element).attr('src', src);

      node.value = $(`body`).html() ?? ''; // fix for cheerio v1
    });
  });
};
