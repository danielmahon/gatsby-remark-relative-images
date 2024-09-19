import path from 'path';
import { defaults, isString } from 'lodash';
import traverse from 'traverse';
import {
  defaultPluginOptions,
  PluginOptions,
  GatsbyFile,
  MarkdownNode,
  findMatchingFile,
} from '.';
import { slash } from './utils';

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

export const onCreateNode = (
  { node, getNodesByType, actions }: GatsbyPluginArgs,
  pluginOptions: PluginOptions,
) => {
  const options = defaults(pluginOptions, defaultPluginOptions);
  const { createNodeField } = actions;

  if (
    (node.fileAbsolutePath && node.internal.type === `MarkdownRemark`) ||
    node.internal.type === `Mdx`
  ) {
    // Filter out files that don't have an absolute path
    const files = getNodesByType(`File`).filter((file) => file.absolutePath);

    const directory = path.dirname(node.fileAbsolutePath);

    // Deeply iterate through frontmatter data for absolute paths
    traverse(node.frontmatter).forEach(function (value) {
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

      const file = findMatchingFile(value, files, options);

      if (!file || typeof file.absolutePath !== 'string') {
        console.error(
          'Invalid file or file.absolutePath is not a string',
          file,
        );
        return; // Skip this iteration or handle this case as appropriate
      }

      const newValue = slash(path.relative(directory, file.absolutePath));
      if (newValue) this.update(newValue);

      createNodeField({
        node,
        name: `frontmatter`,
        value: node.frontmatter,
      });
    });
  }
};
