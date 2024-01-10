FROM verdaccio/verdaccio:5
USER root
RUN npm install --global verdaccio-package-diff
RUN chown -R 10001:65533 "/opt/verdaccio/.npm"
USER $VERDACCIO_USER_UID
