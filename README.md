# gatsby-remark-relative-images

Convert image src(s) in markdown to be relative to their node's parent directory. This will help [gatsby-remark-images](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-remark-images) match images outside the node folder. For example, use with NetlifyCMS.

NOTE: This was built for use with NetlifyCMS and should be considered a temporary solution until relative paths are supported. If it works for other use cases then great!

## Install

`npm install --save gatsby-remark-relative-images`

## How to use

```javascript
// gatsby-config.js
plugins: [
  // Add static assets before markdown files
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      path: `${__dirname}/static/uploads`,
      name: 'uploads',
    },
  },
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      path: `${__dirname}/src/pages`,
      name: 'pages',
    },
  },
  {
    resolve: `gatsby-transformer-remark`,
    options: {
      plugins: [
        // gatsby-remark-relative-images must
        // go before gatsby-remark-images
        {
          resolve: `gatsby-remark-relative-images`,
        },
        {
          resolve: `gatsby-remark-images`,
          options: {
            // It's important to specify the maxWidth (in pixels) of
            // the content container as this plugin uses this as the
            // base for generating different widths of each image.
            maxWidth: 590,
          },
        },
      ],
    },
  },
];
```

### To convert frontmatter images

Use the exported function `fmImagesToRelative` in your `gatsby-node.js`. This takes every node returned by your gatsby-source plugins and converts any absolute paths in markdown frontmatter data into relative paths if a matching file is found.

```js
// gatsby-node.js
const { fmImagesToRelative } = require('gatsby-remark-relative-images');

exports.onCreateNode = ({ node }) => {
  fmImagesToRelative(node);
};
```

## FAQs

### I'm getting the error: Field "image" must not have a selection since type "String" has no subfields
This is a common error when working with Netlify CMS (see issue [gatsby/gatsby#5990](https://github.com/gatsbyjs/gatsby/issues/5990)).

The application must include the `media` with `gatsby-source-filesystem` to include all the uploaded media and to make it available on build time. **Note:** The media folder must be included **before** the other content.

For example, an application that is using NetlifyCMS and this plugin, and has a content folder with markdown that comes from Netlify. Here's how the `gatsby-config.js` should look like:

```js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/static/assets`,
        name: 'assets',
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/content`,
        name: 'content',
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-relative-images`,
          {
            resolve: `gatsby-remark-images`,
            options: {},
          },
        ],
      },
    },
    `gatsby-plugin-netlify-cms`,
  ],
}
```

