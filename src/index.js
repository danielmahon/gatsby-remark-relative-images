const select = require(`unist-util-select`);
const path = require(`path`);
const isRelativeUrl = require(`is-relative-url`);
const _ = require(`lodash`);
const cheerio = require(`cheerio`);
const slash = require(`slash`);
const deepMap = require("deep-map");
const polyfill = require(`babel-polyfill`);

// If the image is relative (not hosted elsewhere)
// 1. Find the image file
// 2. Convert the image src to be relative to its parent node
// This will allow gatsby-remark-images to resolve the image correctly
module.exports = ({ files, markdownNode, markdownAST, pathPrefix, getNode, reporter }, pluginOptions) => {
  const defaults = {};

  const options = _.defaults(pluginOptions, defaults);

  // This will only work for markdown syntax image tags
  const markdownImageNodes = select(markdownAST, `image`);

  // This will also allow the use of html image tags
  const rawHtmlNodes = select(markdownAST, `html`);

  // Promise markdown images in body
  Promise.all(
    // Simple because there is no nesting in markdown
    markdownImageNodes.map(
      node =>
        new Promise(async (resolve, reject) => {
          // Only handle relative (local) urls
          if (!isRelativeUrl(node.url)) {
            return resolve();
          }
          // Get the markdown file's parent directory
          const parentDirectory = getNode(markdownNode.parent).dir;
          // See if there is a matching file path from gatsby-source-filesystem
          const imageNode = _.find(files, file => {
            return slash(path.normalize(file.absolutePath)).endsWith(node.url);
          });
          // Return if we didn't find a match
          if (!imageNode) return resolve();
          // Make the image src relative to the markdown file
          node.url = slash(
            path.relative(parentDirectory, imageNode.absolutePath)
          );
          // Return modified node
          return resolve(node);
        })
    )
  ).then(markdownImageNodes =>
    // Process HTML images in markdown body
    Promise.all(
      // Complex because HTML nodes can contain multiple images
      rawHtmlNodes.map(
        node =>
          new Promise(async (resolve, reject) => {
            if (!node.value) {
              return resolve();
            }

            const $ = cheerio.load(node.value);

            if ($(`img`).length === 0) {
              // No img tags
              return resolve();
            }

            let imageRefs = [];
            $(`img`).each(function() {
              imageRefs.push($(this));
            });

            for (let thisImg of imageRefs) {
              // Get the details we need.
              let formattedImgTag = {};
              formattedImgTag.url = thisImg.attr(`src`);

              if (!formattedImgTag.url) {
                return resolve();
              }
              // Only handle relative (local) urls
              if (!isRelativeUrl(formattedImgTag.url)) {
                return resolve();
              }

              let imagePath;
              const imageNode = _.find(files, file => {
                if (file.sourceInstanceName === options.name) {
									imagePath = path.join(file.dir, path.basename(formattedImgTag.url));
									return slash(path.normalize(file.absolutePath)) === slash(imagePath);
                }
              });

              if (!imageNode) return resolve();

              const parentNode = getNode(markdownNode.parent);
              // Make the image src relative to its parent node
							thisImg.attr("src", slash(path.relative(parentNode.dir, imagePath)));

              node.value = $(`body`).html(); // fix for cheerio v1
            }
            return resolve(node);
          })
      )
			).then(htmlImageNodes => markdownImageNodes.concat(htmlImageNodes).filter(node => !!node))
  );
};

const fileNodes = [];

module.exports.fmImagesToRelative = node => {
  // Save file references
  fileNodes.push(node);
  // Only process markdown files
  if (node.internal.type === `MarkdownRemark` || node.internal.type === `Mdx`) {
    // Convert paths in frontmatter to relative
    function makeRelative(value) {
      if (_.isString(value) && path.isAbsolute(value)) {
        let imagePath;
        const foundImageNode = _.find(fileNodes, file => {
          if (!file.dir) return;
          imagePath = path.join(file.dir, path.basename(value));
          return slash(path.normalize(file.absolutePath)) === slash(imagePath);
        });
        if (foundImageNode) {
					return slash(path.relative(path.join(node.fileAbsolutePath, ".."), imagePath));
        }
      }
      return value;
    }
    // Deeply iterate through frontmatter data for absolute paths
    deepMap(node.frontmatter, makeRelative, { inPlace: true });
  }
};
