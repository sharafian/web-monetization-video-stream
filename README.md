# Web Monetization Video Stream

Allows users of Web Monetization enabled services like
[Flat](https://getflat.com) to pay for a video stream. As money is sent to the
server, it authorizes the stream to send more seconds of video.

## Test it out

Assumes you're running [Moneyd](https://github.com/interledgerjs/moneyd-xrp) and
have a Web Monetization extension like [Minute](https://github.com/sharafian/minute)
or [Flat](https://getflat.com).

Follow their instructions if you don't already have them set up.

```
git clone https://github.com/sharafian/web-monetization-video-stream.git
cd web-monetization-video-stream
mkdir res
# Now move your video file into res/video.mp4
# mv ~/video.mp4 res/video.mp4
npm install
npm start
# Now go to localhost:8080
```

Load localhost:8080. It might take a little while for the video to start playing.
You can see the balance increasing and then being used up in the server logs.

## Watch it Buffer

Disable your monetization extension. Reload `localhost:8080`. The video will load
the first second or two for free, and then it will stop.

Under the video, the page will tell you that your extension is disabled, and
give a receiver URL to pay to manually. Copy the URL down.

Run:

```
npm install -g ilp-spsp
# use the URL that you copied instead of this exact command
ilp-spsp send -a 200 -r http://localhost:8080/pay/c044fea058a6faeaf3cdca113e560262
```

The video will play for a few more seconds, then stop. You can play around with
the parameters here. Try setting up a `while` loop in bash and seeing what
bandwidth you need in order to make the video play smoothly.

# TODOs

- [ ] Pay for video time instead of bytes
- [x] Show video content instead of just audio+white screen (use webm)
