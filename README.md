# Reaction Commerce

[![bitHound Overall Score](https://www.bithound.io/github/reactioncommerce/reaction/badges/score.svg)](https://www.bithound.io/github/reactioncommerce/reaction) [![bitHound Dev Dependencies](https://www.bithound.io/github/reactioncommerce/reaction/badges/devDependencies.svg)](https://www.bithound.io/github/reactioncommerce/reaction/9a858eb459d7260d5ae59124c2b364bc791a3e70/dependencies/npm) [![bitHound Code](https://www.bithound.io/github/reactioncommerce/reaction/badges/code.svg)](https://www.bithound.io/github/reactioncommerce/reaction) [![Circle CI](https://circleci.com/gh/reactioncommerce/reaction.svg?style=svg)](https://circleci.com/gh/reactioncommerce/reaction) [![Gitter](https://badges.gitter.im/JoinChat.svg)](https://gitter.im/reactioncommerce/reaction?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Reaction is an event-driven, real-time reactive commerce platform built with JavaScript (ES6). It plays nicely with npm, Docker, and React.

![Reaction v.1.0.0](https://raw.githubusercontent.com/reactioncommerce/reaction-docs/master/assets/rc-desktop.png)

## Features

Reaction’s out-of-the-box core features include:

-   Drag-and-drop merchandising
-   Order processing
-   Payments
-   Shipping
-   Taxes
-   Discounts
-   Analytics
-   Integration with dozens of third-party apps

Since anything in our codebase can be extended, overwritten, or installed as a package, you may also develop, scale, and customize anything on our platform.

## Installation

**_reaction-cli installation_**

```bash
npm install -g reaction-cli
reaction init
cd reaction
reaction
```

Reaction requires Meteor, Git, MongoDB, OS Specific Build Tools, and (optionally) ImageMagick.

See our [Requirements Docs](https://docs.reactioncommerce.com/reaction-docs/master/requirements) to learn more about requirements for installing Reaction.

For more on setup and configuration, check out the [Installation](https://docs.reactioncommerce.com/reaction-docs/development/installation) and [Configuration](https://docs.reactioncommerce.com/reaction-docs/development/configuration) docs.

### Planning

For an overview of our roadmap, visit our [Features & Roadmap page](https://reactioncommerce.com/roadmap).

You will find the roadmap defined as projects on the [Reaction repository's project page](https://github.com/reactioncommerce/reaction/projects).

Specific features in progress are found on the [Reaction repository's milestones page](https://github.com/reactioncommerce/reaction/milestones).

### Documentation

Release documentation across multiple branches can be found at <https://docs.reactioncommerce.com>.

The Reaction documentation source is located in the [reaction-docs](https://github.com/reactioncommerce/reaction-docs) repository, while the documentation site is in the [reactioncommerce/redoc](https://github.com/reactioncommerce/redoc) application.

API Documentation can also be generated locally, use `npm run docs` to output documentation to `/tmp/reaction-jsdocs/`

### Community

There are many ways to get connected with the Reaction core team and community:

-   [Reaction Commerce Gitter chat](https://gitter.im/reactioncommerce/reaction)
-   [Reaction Commerce forum](https://forums.reactioncommerce.com/)
-   [Reaction Community calls](http://getrxn.io/2rcCal): Join our biweekly community calls every other Wednesday at 7AM PST/10AM EST. Subscribe to our [Reaction Community Google Calendar](http://getrxn.io/2rcCal) to RSVP to the next call and check out the [agenda](https://docs.google.com/document/d/1PwenrammgQJpQfFoUUJZ96i_JJYCM_4glAjB1_ZzgwA/edit?usp=sharing).
-   [Reaction Action](http://getrxn.io/2rcCal): RSVP for the monthly Reaction Action livestreams.

Our [community guidelines](https://docs.reactioncommerce.com/reaction-docs/master/guidelines) can be found in our [documentation](https://docs.reactioncommerce.com/).

### Contributing

Star us on GitHub — it helps!

Interested in participating in the development of Reaction? That's really great! Before you get started, please review our [Community Guidelines](https://docs.reactioncommerce.com/reaction-docs/master/guidelines).

The [Reaction Gitter room](https://gitter.im/reactioncommerce/reaction) and [forum](https://forums.reactioncommerce.com/) are good places to engage with core contributors, the community, and to get familiar with Reaction.

Check out the [Issues](https://github.com/reactioncommerce/reaction/issues) page, and if you find something you want to work on, let us know in the comments. If you're interested in a particular [project](https://github.com/reactioncommerce/reaction/projects) and you aren’t sure where to begin, feel free to ask. Start small!

If your contribution doesn't fit with an existing issue, go ahead and [create an Issue](https://github.com/reactioncommerce/reaction/issues/new) before submitting a [Pull Request](https://help.github.com/articles/about-pull-requests/). This will allow the Reaction team to give feedback if necessary.

Pull Requests should:

-   Be very focused in scope. PRs with smaller scopes are easier to digest and approve.
-   Note any existing associated issues.
-   Lint and adhere to the [Reaction style guide](https://docs.reactioncommerce.com/reaction-docs/master/styleguide).
-   Pass both [acceptance tests and unit testing](https://docs.reactioncommerce.com/reaction-docs/master/testing-reaction).

### Testing

Testing is another great way to contribute. If you do discover a bug, [create an Issue](https://github.com/reactioncommerce/reaction/issues/new) to report it.

Integration tests can be run at the command line with `reaction test`.

### Deployment

We ensure that all releases are deployable as [Docker](https://www.docker.com/) containers.  While we don't regularly test other methods of deployment, our community has documented deployment strategies for AWS, [Digital Ocean](https://gist.github.com/jshimko/745ca66748846551692e24c267a56060), and Galaxy.

For an introduction to Docker deployment, the [Reaction deployment guide](https://docs.reactioncommerce.com/reaction-docs/master/deploying) has detailed examples. We also offer [Reaction Platform](https://reactioncommerce.com/hosting), a managed deployment platform integrated with the Reaction command line.

### License

Copyright © [GNU General Public License v3.0](./LICENSE.md)
