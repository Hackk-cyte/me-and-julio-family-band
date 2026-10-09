import {useEffect,useRef,useState} from 'react';
type Player={playVideo():void;pauseVideo():void;stopVideo():void;seekTo(n:number,b:boolean):void;getCurrentTime():number;getDuration():number;getPlayerState():number;setVolume(n:number):void;destroy():void};
declare global {interface Window {YT?:{Player:new (id:string,options:unknown)=>Player};onYouTubeIframeAPIReady?:()=>void}}
export function useYouTube(enabled:boolean){
 const player=useRef<Player|null>(null);const [ready,setReady]=useState(false);const [error,setError]=useState('');const [state,setState]=useState({playing:false,position:0,duration:0});
 useEffect(()=>{if(!enabled)return;let cancelled=false;
 const init=()=>{if(cancelled||!window.YT)return;player.current=new window.YT.Player('official-player',{videoId:'JVdlpZ4M-Hw',host:'https://www.youtube-nocookie.com',playerVars:{playsinline:1,origin:location.origin,rel:0},events:{onReady:()=>setReady(true),onStateChange:()=>{const p=player.current;if(p)setState({playing:p.getPlayerState()===1,position:p.getCurrentTime(),duration:p.getDuration()})},onError:(e:{data:number})=>setError(`The official player is unavailable here (YouTube ${e.data}). Try the instrumental or open the official recording on YouTube.`),onAutoplayBlocked:()=>setError('Tap the play button inside the official player to start the recording.')}})};
 if(window.YT?.Player)init();else{window.onYouTubeIframeAPIReady=init;if(!document.querySelector('script[data-youtube]')){const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.dataset.youtube='true';script.onerror=()=>setError('The official player could not load. Check your connection or use the instrumental.');document.head.append(script)}}
 const timer=window.setInterval(()=>{const p=player.current;if(p&&readyRef(p))setState({playing:p.getPlayerState()===1,position:p.getCurrentTime(),duration:p.getDuration()})},250);
 const timeout=window.setTimeout(()=>{if(!player.current||!readyRef(player.current))setError('The official player is taking too long to load. Try the instrumental or open YouTube.');},15000);
 return()=>{cancelled=true;clearInterval(timer);clearTimeout(timeout);player.current?.destroy();player.current=null;setReady(false)};
 },[enabled]);
 return {ready,error,...state,play:()=>{setError('');player.current?.playVideo()},pause:()=>player.current?.pauseVideo(),stop:()=>{player.current?.pauseVideo();player.current?.seekTo(0,true)},seek:(n:number)=>player.current?.seekTo(n,true),volume:(n:number)=>player.current?.setVolume(n*100)};
}
function readyRef(p:Player){return typeof p.getPlayerState==='function'}
