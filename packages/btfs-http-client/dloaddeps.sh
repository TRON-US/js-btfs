#!/usr/bin/env bash

#download all the files
node ./src/downloader.js

#fix text in the file
sed -i.bk 's|../../github.com/tron-us/protobuf/gogoproto/|../gogo/|g' ./js-btfs-common/master/js/protos/guard/guard_pb.js
sed -i.bk 's|../../github.com/tron-us/protobuf/gogoproto/|../gogo/|g' ./js-btfs-common/master/js/protos/ledger/ledger_pb.js
sed -i.bk 's|../../github.com/tron-us/protobuf/gogoproto/|../gogo/|g' ./js-btfs-common/master/js/protos/escrow/escrow_pb.js
