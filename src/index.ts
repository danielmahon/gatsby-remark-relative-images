import path from 'path';
import { selectAll } from 'unist-util-select';
import isRelativeUrl from 'is-relative-url';
import { defaults, isString, find, some } from 'lodash';
import cheerio from 'cheerio';
import traverse from 'traverse';
import { slash } from './utils';

export type GatsbyNodePluginArgs = {
  files: GatsbyNode[];
  markdownNode: GatsbyNode;
  markdownAST: any;
  getNode: (id: string) => GatsbyNode;
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
  dir: string;
  absolutePath: string;
  fileAbsolutePath: string;
  frontmatter?: object;
};

export type HtmlNode = {
  value: string;
} & GatsbyNode;

// If the image is relative (not hosted elsewhere)
// 1. Find the image file
// 2. Convert the image src to be relative to its parent node
// This will allow gatsby-remark-images to resolve the image correctly

const defaultPluginOptions = {
  staticFolderName: 'static',
};

const defaultFrontmatterOptions = {
  staticFolderName: 'static',
  include: [],
  exclude: [],
};

const plugin = async (
  { files, markdownNode, markdownAST, getNode }: GatsbyNodePluginArgs,
  pluginOptions: PluginOptions
) => {
  // Default options
  const options = defaults(pluginOptions, defaultPluginOptions);

  const findMatchingNode = (url: string) =>
    find(files, (file) => {
      const staticPath = slash(path.join(options.staticFolderName, url));
      return slash(path.normalize(file.absolutePath)).endsWith(staticPath);
    });

  // Get the markdown file's parent directory
  const parentDirectory = getNode(markdownNode.parent).dir;

  // Process all markdown image nodes
  selectAll('image', markdownAST).forEach((_node: any) => {
    const node = _node as GatsbyNode;
    if (!node.url) return;
    if (!isRelativeUrl(node.url)) return;

    const imageNode = findMatchingNode(node.url);

    // Return if we didn't find a match
    if (!imageNode) return;

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

      if (!url) return;

      // Only handle relative (local) urls
      if (!isRelativeUrl(url)) return;

      const imageNode = findMatchingNode(url);

      if (!imageNode) return;

      // Make the image src relative to its parent node
      const src = path.relative(parentDirectory, imageNode.absolutePath);
      $(element).attr('src', src);

      node.value = $(`body`).html() ?? ''; // fix for cheerio v1
    });
  });
};

const fileNodes: GatsbyNode[] = [];

const fmImagesToRelative = (node: GatsbyNode, _options: FrontMatterOptions) => {
  const options = defaults(_options, defaultFrontmatterOptions);

  // Save file references
  if (node.absolutePath) {
    fileNodes.push(node);
  }
  // Only process markdown files
  if (node.internal.type === `MarkdownRemark` || node.internal.type === `Mdx`) {
    const findMatchingNode = (url: string) =>
      find(fileNodes, (file) => {
        const staticPath = slash(path.join(options.staticFolderName, url));
        return slash(path.normalize(file.absolutePath ?? '')).endsWith(
          staticPath
        );
      });

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

      const imageNode = findMatchingNode(value);

      if (!imageNode) return;

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
