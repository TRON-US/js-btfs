# Upload and sign file to BTFS via browser using btfs-http-client

> In this example, you will find a simple React app to upload a file to BTFS via the browser using btfs-http-client and Webpack.

## Setup

As for any btfs-http-client example, **you need a running BTFS daemon**, you learn how to do that here:

- [Spawn a go-btfs daemon](https://docs.btfs.io/docs/testnet-setup)

**Note:** If you load your app from a different domain than the one the daemon is running (most probably), you will need to set up CORS, see https://github.com/ipfs/js-ipfs-http-client#cors to learn how to do that.

A quick (and dirty way to get it done) is:

```bash
> btfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"*\"]"
> btfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials "[\"true\"]"
```

### Downloading dependencies for development and usage
```
> npm run-script update-js-btfs-commons

```

## Run this example

Once the daemon is on, run the following commands within this folder:

```bash
> npm install
> npm start
```


After uploading a file (left screen), you will see messages on the screen diplaying the stages of signing between backend actors, one-by-one, in the offline signing process,
and once complete, click and opening the uploaded file (right screen), you should see something like:

> ![App Screenshot](https://github.com/TRON-US/js-btfs-http-client/raw/master/examples/upload-file-via-browser/screenshot.png)
