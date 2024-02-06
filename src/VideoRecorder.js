import React, { useEffect, useRef, useState } from 'react';

const VideoRecorder = () => {
    const videoRef = useRef(null);
    const [preview, setPreview] = useState(false);
    const [recording, setRecording] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const [error, setError] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [recordingLength, setRecordingLength] = useState(0);
    const [paused, setPaused] = useState(false);

    let recordedChunks = [];


    const startPreview = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;
            setMediaStream(stream);
            setPreview(true);
        } catch (error) {
            navigator.permissions.query({ name: 'microphone' })
                .then((permissionObj) => {
                    console.log(permissionObj.state);
                })
                .catch((error) => {
                    console.log('Got error :', error);
                })

            navigator.permissions.query({ name: 'camera' })
                .then((permissionObj) => {
                    console.log(permissionObj.state);
                })
                .catch((error) => {
                    console.log('Got error :', error);
                })
        }
    };

    useEffect(() => {
        let timerId;
        if (recording && !paused) {
            timerId = setInterval(() => {
                setRecordingLength(prevLength => prevLength + 1);
            }, 1000);
        } else {
            clearInterval(timerId);
        }
        return () => clearInterval(timerId);
    }, [recording, paused]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };


    const startRecording = async () => {
        try {

            let mediaRecorder = new MediaRecorder(mediaStream);
            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.onstop = handleStop;

            mediaRecorder.start();
            setMediaRecorder(mediaRecorder);
            setRecording(true);
        } catch (error) {
            setError(error.message || 'Failed to access camera and microphone');
        }
    };

    const stopRecording = () => {
        mediaRecorder.stop();
        setRecording(false);
        mediaStream.getTracks().forEach(track => {
            track.stop();
        });
        setRecordingLength(0);
        setPaused(false);
    };

    const pauseRecording = () => {
        mediaRecorder.pause();
        setPaused(true);
    };

    const restartRecording = () => {
        mediaRecorder.resume();
        setPaused(false);
    };

    const handleDataAvailable = (event) => {
        recordedChunks.push(event.data);
    };

    const handleStop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        console.log('URK:', url);
        recordedChunks = [];
    };

    const handleDownload = () => {
        if (videoUrl) {
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = 'recorded-video.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className='Container'>
            {error && <p className='error'>{error}</p>}
            <div className='recorder'><video ref={videoRef} autoPlay muted style={{ width: '100%', height: 'inherit' }} /></div>
            {recording ? <p className="recording-length"><span></span>{formatTime(recordingLength)}</p> : null}
            <div className='button-groups'>
                <button className='button preview' onClick={startPreview}>Preview</button>
                {
                    !recording ? <button onClick={startRecording} className={`button recording-start ${!preview ? 'disable' : ''}`}>Start Recording</button> :
                        <button onClick={stopRecording} className={`button recording-stop ${!preview ? 'disable' : ''}`}>Stop Recording</button>
                }
                {
                    recording ? <>{!paused ? <button className="pause button" onClick={pauseRecording}>Pause Recording</button> : <button className="button pause" onClick={restartRecording}>Restart Recording</button>}</> : null
                }

                {
                    videoUrl ? <button onClick={handleDownload} className='button handle-download'>Download</button> : null
                }
            </div>
        </div>
    );
};

export default VideoRecorder;
