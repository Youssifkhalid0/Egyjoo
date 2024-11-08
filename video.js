let db;
const DB_NAME = 'VideoDatabase';
const STORE_NAME = 'videos';

document.addEventListener('DOMContentLoaded', function() {
    const videoPlayer = document.getElementById('video-player');
    const videoTitle = document.getElementById('video-title');
    const videoDescription = document.getElementById('video-description');
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const ratingStars = document.querySelectorAll('.rating-star');

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = parseInt(urlParams.get('id'));

    const dbRequest = indexedDB.open(DB_NAME, 1);

    dbRequest.onerror = function(event) {
        console.error("IndexedDB error:", event.target.error);
    };

    dbRequest.onsuccess = function(event) {
        db = event.target.result;
        loadVideo();
    };

    function loadVideo() {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(videoId);

        request.onsuccess = function(event) {
            const video = event.target.result;
            if (video) {
                videoPlayer.src = `https://www.youtube.com/embed/${getYouTubeID(video.url)}`;
                videoTitle.textContent = video.title;
                videoDescription.textContent = video.description;
                updateRating(video.rating);
                displayComments(video.comments);
            }
        };
    }

    function updateRating(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    function displayComments(comments) {
        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const li = document.createElement('li');
            li.textContent = comment;
            commentsList.appendChild(li);
        });
    }

    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const commentInput = document.getElementById('comment-input');
        const comment = commentInput.value.trim();

        if (comment) {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(videoId);

            request.onsuccess = function(event) {
                const video = event.target.result;
                video.comments.push(comment);
                objectStore.put(video);
                commentInput.value = '';
                displayComments(video.comments);
            };
        }
    });

    ratingStars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = index + 1;
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(videoId);

            request.onsuccess = function(event) {
                const video = event.target.result;
                video.rating = rating;
                objectStore.put(video);
                updateRating(rating);
            };
        });
    });
});

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}