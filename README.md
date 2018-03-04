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

```
stream_url="http://localhost:8080/pay/c044fea058a6faeaf3cdca113e560262"

# the video will barely play with a bandwidth of 10
while [ 1 ]; do ilp-spsp send -a 10 -r $stream_url; done

# the video will work but may occasionally buffer
while [ 1 ]; do ilp-spsp send -a 25 -r $stream_url; done

# the video will play with no interruptions
while [ 1 ]; do ilp-spsp send -a 200 -r $stream_url; done
```

## How does it work?

When the page starts:

1. The page generates a random ID for your session.
2. The page constructs an SPSP receiver url, equal to `http://localhost:8080/pay/${ID}`.
3. The page calls monetize, using the SPSP receiver.
4. The page inserts a video element, and loads it from `http://localhost:8080/video/123/${ID}`.
5. The server creates a video stream associated with your ID.
5. The video loads about a second of content for free, so the loading process is faster.

As you stay on the page:

1. The server gets money from the browser and puts it in a bucket associated with the ID.
2. As the video stream reads bytes from disk, it decrements its bucket's balance. When it hits zero the stream is paused.
3. When the bucket's balance is refilled, the video stream unpauses and begins spending the balance again.

# TODOs

- [ ] Pay for video time instead of bytes
- [x] Show video content instead of just audio+white screen (use webm)
