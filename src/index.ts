import path from 'path';
import { selectAll } from 'unist-util-select';
import { defaults, isString, find } from 'lodash';
import cheerio from 'cheerio';
import traverse from 'traverse';
import { slash } from './utils';

export type GatsbyNodePluginArgs = {
  files: GatsbyNode[];
  markdownNode: GatsbyNode;
  markdownAST: any;
  getNode: (id: string) => GatsbyNode | undefined;
};

export type PluginOptions = {
  staticFolderName: string;
};

export type FrontMatterOptions = {
  staticFolderName: string;
  include: string[];
  exclude: string[];
};

export type GatsbyNode = {
  url: string;
  path?: string;
  value?: string | null;
  internal: {
    type: string;
  };
  parent: string;
  dir?: string;
  absolutePath: string;
  fileAbsolutePath: string;
  frontmatter?: object;
};

export type HtmlNode = {
  value: string;
} & GatsbyNode;

const defaultPluginOptions = {
  staticFolderName: 'static',
};

const defaultFrontmatterOptions = {
  staticFolderName: 'static',
  include: [],
  exclude: [],
};

const findMatchingNode = (
  url: string,
  files: GatsbyNode[],
  staticFolderName: string
) => {
  const result = find(files, (file) => {
    const staticPath = slash(path.join(staticFolderName, url));
    return slash(path.normalize(file.absolutePath)).endsWith(staticPath);
  });
  if (!result) {
    throw new Error(
      `No matching file found for src "${url}" in static folder "${staticFolderName}". Please check static folder name and that file exists at "${staticFolderName}${url}". This error will probably cause a "GraphQLDocumentError" later in build. All converted field paths MUST resolve to a matching file in the "static" folder.`
    );
  }
  return result;
};

const plugin = async (
  { files, markdownNode, markdownAST, getNode }: GatsbyNodePluginArgs,
  pluginOptions: PluginOptions
) => {
  // Default options
  const options = defaults(pluginOptions, defaultPluginOptions);

  // Get the markdown file's parent directory
  const parentDirectory = getNode(markdownNode.parent)?.dir ?? '';

  // Process all markdown image nodes
  selectAll('image', markdownAST).forEach((_node: any) => {
    const node = _node as GatsbyNode;
    if (!node.url) return;
    if (!path.isAbsolute(node.url)) return;

    const imageNode = findMatchingNode(
      node.url,
      files,
      options.staticFolderName
    );

    // Update node.url to be relative to its parent file
    node.url = path.relative(parentDirectory, imageNode.absolutePath);
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
      if (!url || !path.isAbsolute(url)) return;

      const imageNode = findMatchingNode(url, files, options.staticFolderName);

      // Make the image src relative to its parent node
      const src = path.relative(parentDirectory, imageNode.absolutePath);
      $(element).attr('src', src);

      node.value = $(`body`).html() ?? ''; // fix for cheerio v1
    });
  });
};

const fmImagesToRelative = (
  node: GatsbyNode,
  getNodes: () => GatsbyNode[],
  _options: FrontMatterOptions
) => {
  const options = defaults(_options, defaultFrontmatterOptions);

  const files = getNodes().filter((n) => n.absolutePath);

  // Only process markdown files
  if (node.internal.type === `MarkdownRemark` || node.internal.type === `Mdx`) {
    // Deeply iterate through frontmatter data for absolute paths
    traverse(node.frontmatter).forEach(function (value) {
      if (!isString(value)) return;
      if (!path.isAbsolute(value)) return;

      const paths = this.path.reduce<string[]>((acc, current) => {
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

      if (!shouldTransform) return;

      const imageNode = findMatchingNode(
        value,
        files,
        options.staticFolderName
      );

      const newValue = path.relative(
        path.join(node.fileAbsolutePath, '..'),
        imageNode.absolutePath
      );

      this.update(newValue);
    });
  }
};

export default plugin;
export { fmImagesToRelative };
