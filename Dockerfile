FROM scratch

WORKDIR /build

COPY scripts scripts
COPY functions functions
COPY items items
COPY texts texts
COPY entities entities

CMD cp -r /build /target