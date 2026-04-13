exports.isImage = (mime) => {
    return mime.startsWith("image/");
};

exports.isVideo = (mime) => {
    return mime.startsWith("video/");
};