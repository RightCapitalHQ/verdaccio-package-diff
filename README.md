# Verdaccio Package Diff Plugin

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
