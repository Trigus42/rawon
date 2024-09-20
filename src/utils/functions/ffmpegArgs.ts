import type { Segment } from "sponsorblock-api";

export const audioFilters = {
    bassboost: "bass=g=7.5",
    nightcore: "aresample=48000,asetrate=48000*1.25",
    vaporwave: "aresample=48000,asetrate=48000*0.8",
    treble: "treble=g=5",
    "8d": "apulsator=hz=0.08",
    reverse: "areverse",
    surround: "surround",
    haas: "haas",
    phaser: "aphaser=in_gain=0.4",
    gate: "agate",
    mcompand: "mcompand",
    flanger: "flanger",
    tremolo: "tremolo",
    karaoke: "stereotools=mlev=0.1",
    vibrato: "vibrato=f=6.5",
    echo: "aecho=0.8:0.9:1000:0.3"
}

export function ffmpegArgs(filters: Partial<Record<keyof typeof audioFilters, boolean>>, skipSegments: Segment[]): string[] {
    const keys = Object.keys(filters) as (keyof typeof audioFilters)[];
    const effectArgs = keys.some(x => filters[x]) ? [
        "-af",
        keys.reduce<string[]>((pr, cu) => {
            if (filters[cu] === true) pr.push(audioFilters[cu]);
            return pr;
        }, []).join(",")
    ] : [];
    
    const segmentArgs = skipSegments.length > 0 ? [
        "-af",
        `aselect='not(${skipSegments.map(x => `between(t,${x.startTime},${x.endTime})`).join("+")})'`
    ] : [];

    return [
        "-loglevel", "0",
        "-ar", "48000",
        "-ac", "2",
        "-f", "opus",
        "-acodec", "libopus",
        ...effectArgs,
        ...segmentArgs
    ]
}
