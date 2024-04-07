FROM node:lts-alpine as builder

RUN mkdir -p /verdaccio/plugins \
  && cd /verdaccio/plugins \
  && npm install --global-style --no-bin-links --omit=optional @rightcapital/verdaccio-package-diff

FROM verdaccio/verdaccio:5

COPY --from=builder --chown=$VERDACCIO_USER_UID:root \
  /verdaccio/plugins/node_modules/@rightcapital/verdaccio-package-diff \
  /verdaccio/plugins/@rightcapital/verdaccio-package-diff

USER root

RUN mkdir -p /opt/verdaccio/.npm
RUN chown -R  $VERDACCIO_USER_UID:root /opt/verdaccio/.npm

USER $VERDACCIO_USER_UID
