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

Put a 

Load localhost:8080. It might take a little while for the video to start playing.
You can see the balance increasing and then being used up in the server logs.

Once the page begins playing, try disabling your Web Monetization extension. You
can now see the balance decreasing in the server logs. Once the balance reaches zero,
the video is going to stop playing.

Go into the page's console and look at the line that says `run monetize...`.
Re-enable your Web Monetization extension and copy the function call into the
console. This will cause the video to start playing again immediately, as the money
goes to the server.
