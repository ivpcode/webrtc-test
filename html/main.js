import RoomConnection from "./room-connection"

window.addEventListener("DOMContentLoaded", async ()=>{

	let ls = await GetLocalStream()

	//** Rimuovendo questa linea no si ha il proprio video nello schermo, ma solo quelli remoti */
	//AddVideo("Local_Stream",ls) 

	window.room_connection = new RoomConnection()

	/** Rimuovendo la linea seguente si ha una connessione WebRTc senza stream audio-video */ 
	await window.room_connection.SetLocalStream(ls)
	
	window.room_connection.AddRemoteStream = async (remote_peer_id,stream) => {
		AddVideo(remote_peer_id,stream)
	}

	window.room_connection.RemoveRemoteStream = async (remote_peer_id) => {
		RemoveVideo(remote_peer_id)
	}
	
	await window.room_connection.Connect("wss://"+document.location.hostname+"/ws")
})



async function GetLocalStream() {
	try {
		const constraints = {audio: true, video: true};
		const stream = await navigator.mediaDevices.getUserMedia(constraints);

		return stream

	} catch (err) {
		console.error(err);
	}
}

async function AddVideo(peer_id, stream) {
	let video = document.getElementById(peer_id)
	if (video == null) {
		video = document.createElement("video")
		video.setAttribute("id",peer_id)
		document.querySelector(".videos_container").append(video)
	}
	
	video.playsinline = "playsinline"
	video.autoplay = true
	video.muted = "muted"  
	video.srcObject = stream;
}

function RemoveVideo(peer_id) {
	let video = document.getElementById(peer_id)
	if (video != null)
		video.remove()
}