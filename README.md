# andrew-houghton.github.io
WikiRiver Offline Tool


Functions on page:
    Search for gauges
    Copy gauge id
    Insert current location with location permission
    Checkbox for plaintext
    Insert client version
    Paste received string into box and view data

Data to store:
    http://localhost:8000/email/gauges.js
    weather icons
    decoding js script

Note: should all be one page for simplicity

Toggle button at top to switch modes.

Parser:
    Textarea
    Button below
    When run it fills the area below the button with formatted data.

CSS docs https://getmdl.io/components/index.html

## Build

```
rm workbox-23958734.js workbox-23958734.js.map
npx workbox generateSW workbox-config.js
```
