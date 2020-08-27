# gatsby-remark-relative-images

Convert image src(s) in markdown/html/frontmatter to be relative to their node's parent directory. This will help [gatsby-remark-images](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-remark-images) match images outside the node folder. For example, use with NetlifyCMS.

NOTE: This was built for use with NetlifyCMS and should be considered a temporary solution until relative paths are supported. If it works for other use cases then great!

### Features

- [x] Converts markdown/mdx images
- [x] Converts `src` in markdown/mdx html `<img />` tags
- [x] Converts frontmatter fields, supports nested fields
- [x] Suports Unicode characters
- [x] Frontmatter field filters (include/exclude)

### v2 Breaking Changes:

`fmImagesToRelative` has been removed, it is no longer needed

## Install

```bash
yarn add gatsby-remark-relative-images

npm i gatsby-remark-relative-images
```

## Usage Example

/gatsby-config.js

```javascript
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
          options: {
            // [Optional] The root of "media_folder" in your config.yml
            // Defaults to "static"
            staticFolderName: 'static',
            // [Optional] Include the following fields, use dot notation for nested fields
            // All fields are included by default
            include: ['featured'],
            // [Optional] Exclude the following fields, use dot notation for nested fields
            // No fields are excluded by default
            exclude: ['featured.skip'],
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

/static/admin/config.yml

```yml
# ...
media_folder: static/img
public_folder: /img
# ...
```

/src/pages/blog-post.md

```md
---
templateKey: blog-post
title: A beginners’ guide to brewing with Chemex
date: 2017-01-04T15:04:10.000Z
featured: { image: /img/chémex.jpg, skip: /img/chémex.jpg }
<!-- featured: { image: ../../static/img/chémex.jpg, skip: /img/chémex.jpg } -->
description: Brewing with a Chemex probably seems like a complicated, time-consuming ordeal, but once you get used to the process, it becomes a soothing ritual that's worth the effort every time.
---

![chemex](/img/chémex.jpg)

<!-- ![chemex](../../static/img/chémex.jpg) -->

This week we’ll **take** a look at all the steps required to make astonishing coffee with a Chemex at home. The Chemex Coffeemaker is a manual, pour-over style glass-container coffeemaker that Peter Schlumbohm invented in 1941, and which continues to be manufactured by the Chemex Corporation in Chicopee, Massachusetts.

In 1958, designers at the [Illinois Institute of Technology](https://www.spacefarm.digital) said that the Chemex Coffeemaker is _"one of the best-designed products of modern times"_, and so is included in the collection of the Museum of Modern Art in New York City.

## The little secrets of Chemex brewing

<img src="/img/chémex.jpg" alt="" style="width: 250px" />
<!-- <img src="../../static/img/chémex.jpg" alt="" style="width: 250px" /> -->

The Chemex Coffeemaker consists of an hourglass-shaped glass flask with a conical funnel-like neck (rather than the cylindrical neck of an Erlenmeyer flask) and uses proprietary filters, made of bonded paper (thicker-gauge paper than the standard paper filters for a drip-method coffeemaker) that removes most of the coffee oils, brewing coffee with a taste that is different than coffee brewed in other coffee-making systems; also, the thicker paper of the Chemex coffee filters may assist in removing cafestol, a cholesterol-containing compound found in coffee oils.
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
};
```
