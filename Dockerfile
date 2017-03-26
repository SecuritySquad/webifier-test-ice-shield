FROM gliderlabs/alpine:3.3

COPY ./res/phantomjs-2.1.1-linux-x86_64.tar.bz2 /tmp/phantomjs.tar.bz2

RUN apk add --update --no-cache fontconfig \
    && tar -jxf /tmp/phantomjs.tar.bz2 \
    && mkdir /app \
    && mv /tmp/phantomjs/bin/phantomjs /app

COPY ice-shield.js /app

WORKDIR /app

CMD ["phantomjs --ignore-ssl-errors=true", "ice-shield.js", $URL]
