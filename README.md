# Verdaccio Package Diff Plugin

<!-- Badges area start -->

[![made by RightCapital](https://img.shields.io/badge/made_by-RightCapital-5070e6)](https://rightcapital.com)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/RightCapitalHQ/verdaccio-package-diff/ci.yml)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![RightCapital frontend style guide](https://img.shields.io/badge/code_style-RightCapital-5c4c64?labelColor=f0ede8)](https://github.com/RightCapitalHQ/frontend-style-guide)

<!-- Badges area end -->

## Introduce

If you want to know what has changed between the two versions in the package, this plugin can tell you.

## How to use

To view the diffs between two versions of a package, go to:

```text
{YOUR_VERDACCIO_SITE}/-/npm/package-diff/viewer?name={PACKAGE_NAME}&from={PACKAGE_VERSION_A}&to={PACKAGE_VERSION_B}
```

This will display the file differences between the two versions.

## How to install

### Build your own docker image

To install this plugin in your own Verdaccio docker image:

[Refer to the Verdaccio documentation on creating custom Dockerfile](https://verdaccio.org/docs/docker/#creating-your-own-dockerfile-using-verdaccioverdacciotag-as-base)

Create a Dockerfile:

```dockerfile
FROM verdaccio/verdaccio:5
USER root
RUN npm install --global @rightcapital/verdaccio-package-diff
RUN chown -R 10001:65533 "/opt/verdaccio/.npm"
USER $VERDACCIO_USER_UID
```

### Config plugin

Enable the plugin in your `config.yaml`:

```yaml
middlewares:
  '@rightcapital/verdaccio-package-diff':
    enabled: true
```

### Set plugin permissions

Create a `.npmrc` file for your container, this will allow the plugin to access private packages.

```yaml
volumes:
  - './.npmrc:/opt/verdaccio/.npmrc'
```

#### About permissions

You can use Verdaccio [packages](https://verdaccio.org/docs/configuration/#packages) configuration to control which packages can be access by package diff plugin.
