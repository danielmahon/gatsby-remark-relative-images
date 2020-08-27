import path from 'path';
import { selectAll } from 'unist-util-select';
import { defaults, isString, find } from 'lodash';
import cheerio from 'cheerio';
import traverse from 'traverse';
import { slash } from './utils';

export type GatsbyNodePluginArgs = {
  files: GatsbyFile[];
  markdownNode: MarkdownNode;
  markdownAST: any;
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

const defaultPluginOptions = {
  staticFolderName: 'static',
  include: [],
  exclude: [],
};

const plugin = async (
  { files, markdownNode, markdownAST }: GatsbyNodePluginArgs,
  pluginOptions: PluginOptions
) => {
  const findMatchingFile = (src: string) => {
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

  // Default options
  const options = defaults(pluginOptions, defaultPluginOptions);

  if (!markdownNode.fileAbsolutePath) return;

  const directory = path.dirname(markdownNode.fileAbsolutePath);

  // Process all markdown image nodes
  selectAll('image', markdownAST).forEach((_node: any) => {
    const node = _node as MarkdownNode;
    if (!isString(node.url)) return;
    if (!path.isAbsolute(node.url) || !path.extname(node.url)) return;

    const file = findMatchingFile(node.url);

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

      const file = findMatchingFile(url);

      // Make the image src relative to its parent node
      const src = path.relative(directory, file.absolutePath);
      $(element).attr('src', src);

      node.value = $(`body`).html() ?? ''; // fix for cheerio v1
    });
  });

  // Deeply iterate through frontmatter data for absolute paths
  traverse(markdownNode.frontmatter).forEach(function (value) {
    if (!isString(value)) return;
    if (!path.isAbsolute(value) || !path.extname(value)) return;

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

    const file = findMatchingFile(value);

    const newValue = path.relative(directory, file.absolutePath);

    this.update(newValue);
  });
};

export default plugin;
