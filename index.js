"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

var select = require("unist-util-select");

var path = require("path");

var isRelativeUrl = require("is-relative-url");

var _ = require("lodash");

var cheerio = require("cheerio");

var slash = require("slash");

var deepMap = require("deep-map");

var polyfill = require("babel-polyfill"); // If the image is relative (not hosted elsewhere)
// 1. Find the image file
// 2. Convert the image src to be relative to its parent node
// This will allow gatsby-remark-images to resolve the image correctly


module.exports = function (_ref, pluginOptions) {
  var files = _ref.files,
      markdownNode = _ref.markdownNode,
      markdownAST = _ref.markdownAST,
      pathPrefix = _ref.pathPrefix,
      getNode = _ref.getNode,
      reporter = _ref.reporter;
  var defaults = {};

  var options = _.defaults(pluginOptions, defaults); // This will only work for markdown syntax image tags


  var markdownImageNodes = select(markdownAST, "image"); // This will also allow the use of html image tags

  var rawHtmlNodes = select(markdownAST, "html"); // Promise markdown images in body

  Promise.all( // Simple because there is no nesting in markdown
  markdownImageNodes.map(function (node) {
    return new Promise(
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(resolve, reject) {
        var imagePath, imageNode, parentDirectory;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (isRelativeUrl(node.url)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", resolve());

              case 2:
                // See if there is a matching file path from gatsby-source-filesystem
                imageNode = _.find(files, function (file) {
                  imagePath = path.join(file.dir, path.basename(node.url));
                  return slash(path.normalize(file.absolutePath)) === slash(imagePath);
                }); // Return if we didn't find a match

                if (imageNode) {
                  _context.next = 5;
                  break;
                }

                return _context.abrupt("return", resolve());

              case 5:
                // Get the markdown file's parent directory
                parentDirectory = getNode(markdownNode.parent).dir; // Make the image src relative to the markdown file

                node.url = slash(path.relative(parentDirectory, imagePath)); // Return modified node

                return _context.abrupt("return", resolve(node));

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function (_x, _x2) {
        return _ref2.apply(this, arguments);
      };
    }());
  })).then(function (markdownImageNodes) {
    return (// Process HTML images in markdown body
      Promise.all( // Complex because HTML nodes can contain multiple images
      rawHtmlNodes.map(function (node) {
        return new Promise(
        /*#__PURE__*/
        function () {
          var _ref3 = _asyncToGenerator(
          /*#__PURE__*/
          regeneratorRuntime.mark(function _callee2(resolve, reject) {
            var $, imageRefs, _loop, _i, _ret;

            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    if (node.value) {
                      _context2.next = 2;
                      break;
                    }

                    return _context2.abrupt("return", resolve());

                  case 2:
                    $ = cheerio.load(node.value);

                    if (!($("img").length === 0)) {
                      _context2.next = 5;
                      break;
                    }

                    return _context2.abrupt("return", resolve());

                  case 5:
                    imageRefs = [];
                    $("img").each(function () {
                      imageRefs.push($(this));
                    });

                    _loop = function _loop() {
                      var thisImg = imageRefs[_i];
                      // Get the details we need.
                      var formattedImgTag = {};
                      formattedImgTag.url = thisImg.attr("src");

                      if (!formattedImgTag.url) {
                        return {
                          v: resolve()
                        };
                      } // Only handle relative (local) urls


                      if (!isRelativeUrl(formattedImgTag.url)) {
                        return {
                          v: resolve()
                        };
                      }

                      var imagePath = void 0;

                      var imageNode = _.find(files, function (file) {
                        if (file.sourceInstanceName === options.name) {
                          imagePath = path.join(file.dir, path.basename(formattedImgTag.url));
                          return slash(path.normalize(file.absolutePath)) === slash(imagePath);
                        }
                      });

                      if (!imageNode) return {
                        v: resolve()
                      };
                      var parentNode = getNode(markdownNode.parent); // Make the image src relative to its parent node

                      thisImg.attr("src", slash(path.relative(parentNode.dir, imagePath)));
                      node.value = $("body").html(); // fix for cheerio v1
                    };

                    _i = 0;

                  case 9:
                    if (!(_i < imageRefs.length)) {
                      _context2.next = 16;
                      break;
                    }

                    _ret = _loop();

                    if (!(_typeof(_ret) === "object")) {
                      _context2.next = 13;
                      break;
                    }

                    return _context2.abrupt("return", _ret.v);

                  case 13:
                    _i++;
                    _context2.next = 9;
                    break;

                  case 16:
                    return _context2.abrupt("return", resolve(node));

                  case 17:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          return function (_x3, _x4) {
            return _ref3.apply(this, arguments);
          };
        }());
      })).then(function (htmlImageNodes) {
        return markdownImageNodes.concat(htmlImageNodes).filter(function (node) {
          return !!node;
        });
      })
    );
  });
};

var fileNodes = [];

module.exports.fmImagesToRelative = function (node) {
  // Save file references
  fileNodes.push(node); // Only process markdown files

  if (node.internal.type === "MarkdownRemark") {
    // Convert paths in frontmatter to relative
    var makeRelative = function makeRelative(value) {
      if (_.isString(value) && path.isAbsolute(value)) {
        var imagePath;

        var foundImageNode = _.find(fileNodes, function (file) {
          if (!file.dir) return;
          imagePath = path.join(file.dir, path.basename(value));
          return slash(path.normalize(file.absolutePath)) === slash(imagePath);
        });

        if (foundImageNode) {
          return slash(path.relative(path.join(node.fileAbsolutePath, ".."), imagePath));
        }
      }

      return value;
    }; // Deeply iterate through frontmatter data for absolute paths


    deepMap(node.frontmatter, makeRelative, {
      inPlace: true
    });
  }
};