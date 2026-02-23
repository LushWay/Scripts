FROM scratch

WORKDIR /build

COPY scripts scripts
COPY functions functions
COPY items items
COPY texts texts
COPY entities entities
COPY structures structures
COPY manifest.json manifest.json

CMD cp -r /build/* /target