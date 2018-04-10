# gatsby-remark-relative-images

Convert image src(s) in markdown to be relative to their node's parent directory. This will help [gatsby-remark-images](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-remark-images) match images outside the node folder. For example, use with NetlifyCMS.

## Install

`npm install --save gatsby-remark-relative-images`

## How to use

```javascript
// In your gatsby-config.js
plugins: [
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      path: `${__dirname}/static/uploads`,
      name: 'uploads',
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
          options: {
            // Set the name option to the same
            // name you set for gatsby-source-filesystem
            name: 'uploads', // default
          },
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

## Options

| Name   | Default   | Description                                                                             |
| ------ | --------- | --------------------------------------------------------------------------------------- |
| `name` | `uploads` | Set the `name` option to the same `options.name` you set for `gatsby-source-filesystem` |
