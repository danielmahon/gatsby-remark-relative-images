const select = require(`unist-util-select`);
const path = require(`path`);
const isRelativeUrl = require(`is-relative-url`);
const _ = require(`lodash`);
const cheerio = require(`cheerio`);
const slash = require(`slash`);

// If the image is relative (not hosted elsewhere)
// 1. Find the image file
// 2. Convert the image src to be relative to its parent node
// This will allow gatsby-remark-images to resolve the image correctly
module.exports = (
  { files, markdownNode, markdownAST, pathPrefix, getNode, reporter },
  pluginOptions
) => {
  const defaults = {
    name: 'uploads',
  };

  const options = _.defaults(pluginOptions, defaults);

  // This will only work for markdown syntax image tags
  const markdownImageNodes = select(markdownAST, `image`);

  // This will also allow the use of html image tags
  const rawHtmlNodes = select(markdownAST, `html`);

  return Promise.all(
    // Simple because there is no nesting in markdown
    markdownImageNodes.map(
      node =>
        new Promise(async (resolve, reject) => {
          // Only handle relative (local) urls
          if (!isRelativeUrl(node.url)) {
            return resolve();
          }
          let imagePath;
          const imageNode = _.find(files, file => {
            if (file.sourceInstanceName === options.name) {
              imagePath = slash(path.join(file.dir, '..', node.url));
              return file.absolutePath === imagePath;
            }
          });

          const parentNode = getNode(markdownNode.parent);
          // Make the image src relative to its parent node
          node.url = path.relative(parentNode.dir, imagePath);

          return resolve(node);
        })
    )
  ).then(markdownImageNodes =>
    // HTML image node stuff
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
                  imagePath = slash(
                    path.join(file.dir, '..', formattedImgTag.url)
                  );
                  return file.absolutePath === imagePath;
                }
              });

              const parentNode = getNode(markdownNode.parent);
              // Make the image src relative to its parent node
              thisImg.attr('src', path.relative(parentNode.dir, imagePath));

              node.value = $(`body`).html(); // fix for cheerio v1
            }
            return resolve(node);
          })
      )
    ).then(htmlImageNodes =>
      markdownImageNodes.concat(htmlImageNodes).filter(node => !!node)
    )
  );
};
