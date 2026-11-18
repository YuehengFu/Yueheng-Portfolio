function InstagramEmbed({ shortcode }) {
  return (
    <iframe
      className="instagram-iframe"
      src={`https://www.instagram.com/p/${shortcode}/embed`}
      title="Instagram post"
      scrolling="no"
    />
  );
}

export default InstagramEmbed;
