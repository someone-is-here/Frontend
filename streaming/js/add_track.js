import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getDatabase, ref, set, get, update, child } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
      onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDd2TdBKvjDRzfaScSO5GZJOnJCQAIt9nA",
    authDomain: "streaming-service-a0d17.firebaseapp.com",
    projectId: "streaming-service-a0d17",
    storageBucket: "streaming-service-a0d17.appspot.com",
    messagingSenderId: "970367674144",
    appId: "1:970367674144:web:de960ab528bbca0c83d945",
    measurementId: "G-EZE9Q32626"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage();

const auth = getAuth();

let filesPicture = [], filesTrack = [];
let reader = new FileReader();
let pictureInput = document.getElementById("id_track_cover");
let trackInput = document.getElementById("id_track");

pictureInput.onchange = event => {
    filesPicture = event.target.files;
    reader.readAsDataURL(filesPicture[0]);
};
let audio = document.createElement('audio');
trackInput.onchange = event => {
    filesTrack = event.target.files;
    reader.onload = function (e) {
            audio.src = e.target.result;
            audio.addEventListener('loadedmetadata', function(){
                let audioDur = audio.duration;
                window.duration = audioDur.toFixed(2);

            },false);
        };
    reader.readAsDataURL(trackInput[0]);
}

let selectAlbum = document.getElementById("id_album_select");


let uploadedProgressPicture = document.getElementById("uploadProgress");
let uploadedProgressTrack = document.getElementById("uploadProgressTrack");

function getOptionTemplate(name){
    return `<option value="${name}">${name}</option>`
}
function setAlbums(albumsList){
    let resultList = "";
    console.log(albumsList);
    for (let item in albumsList){
        console.log(item);
        resultList += getOptionTemplate(item);
    }
    selectAlbum.innerHTML = resultList;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        try { get(child(dbRef, `users/` + user.uid + `/albums/`)).then((snapshot) => {
            if (snapshot.exists()) {
                console.log(snapshot.val());
                setAlbums(snapshot.val());
            } else {
                window.location.replace("add_album.html");
            }
        }).catch((error) => {
            console.error(error);
        });
        } catch (e){
            window.location.replace("add_album.html");
        }

        document.getElementById("button_submit").addEventListener("click", function (event) {
            event.preventDefault();
            const trackTitle = document.getElementById("id_track_title").value;

            const imageToUpload = filesPicture[0];
            const filename = imageToUpload.name;
            const metaData = {
                contentType: imageToUpload.type
            }
            const storageRef = sRef(storage, "images/tracks/" + user.uid + filename);
            const uploadTask = uploadBytesResumable(storageRef, imageToUpload, metaData);

            uploadTask.on('state-changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadedProgressPicture.innerHTML = "Uploaded " + progress + "%";
            }, (error) => {
                alert("Error! Image not uploaded!");
            }, () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log("Set album into db");
                     const trackToUpload = filesTrack[0];
                     const filename = trackToUpload.name;
                      const metaData = {
                        contentType: trackToUpload.type
                        }
                    const storageRef = sRef(storage, "tracks/" + user.uid + filename);
                    const uploadTask = uploadBytesResumable(storageRef, trackToUpload, metaData);
                    uploadTask.on('state-changed', (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        uploadedProgressTrack.innerHTML = "Uploaded " + progress + "%";
                        }, (error) => {
                            alert("Error! Track not uploaded!");
                        }, () => {
                            getDownloadURL(uploadTask.snapshot.ref).then((downloadURLTrack) => {
                                let trackObj = {
                                    [trackTitle]:{
                                        cover: downloadURL,
                                        track: downloadURLTrack,
                                        timing: window.duration
                                    }
                                };

                                set(ref(database, 'users/' + user.uid + '/albums/tracks'), trackObj);
                                window.location.replace("add_track.html");
                            });
                    });
                });
            });
        });
    } else {
        window.location.replace("login.html");
    }
});
