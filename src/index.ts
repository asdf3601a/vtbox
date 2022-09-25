import * as cheerio from 'cheerio';
import { Router } from 'itty-router';
import { BOX } from './VTubers';

// YT
type Author = {
    name: string,
    uri: string,
};
type Video = {
    id: string,
    videoId: string,
    channelId: string,
    title: string,
    alternate?: string,
    author: Author,
    published: Date,
    updated: Date,
    thumbnail?: string,
    description: string,
    views?: string,
};
type Channel = {
    id: string,
    channelId: string,
    avatar?: string,
    title: string,
    alternate?: string,
    author: Author,
    published: Date,
    Videos: Video[],
};

const RSS_BASE = "https://www.youtube.com/feeds/videos.xml?channel_id=";

const router = Router();

router
    .get(
        "/",
        async (): Promise<Response> => {
            return new Response(
            `
			<!DOCTYPE html>
			<html lang="zh-Hant">
			<head>
				<meta charset="UTF-8">
				<title>Cute Index</title>
				<!-- Tocas Recommend -->
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tocas/4.0.4/tocas.min.css">
				<script src="https://cdnjs.cloudflare.com/ajax/libs/tocas/4.0.4/tocas.min.js"></script>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
				<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" />
			</head>
			<body>
				<div class="ts-center">
					<div class="ts-box is-hollowed">
						<div class="ts-content is-vertically-padded">
							<div class="ts-center">
								<div class="ts-header is-heavy">這只是個可愛 API</div>
								<div class="ts-text is-secondary">有 Rate Limit 麻煩手下留情</div>
							</div>
						</div>
					</div>
				</div>
			</body>
			</html>
			`,
                {
                    headers: {
                        'content-type': 'text/html;charset=UTF-8',
                    }
                }
            )
        }
    )
    .get(
        "/list",
        async (): Promise<Response> => {
            return new Response(
                JSON.stringify(
                    BOX.map(
                        (elem) => elem.name
                    )
                ),
                {
                    headers: {
                        'content-type': 'application/json;charset=UTF-8',
                    }
                }
            )
        }
    )
    .get(
        "/box",
        async (): Promise<Response> => {
            let channels: Channel[] = [];

            for (const VTB of BOX) {
                let feed = cheerio.load(
                    await (await fetch(RSS_BASE+VTB.uid)).text(),
                )
                channels.push(
                    {
                        id: feed("feed>id").text(),
                        channelId: feed("feed>yt\\:channelId").text(),
                        avatar: VTB.avatar,
                        title: feed("feed>title").text(),
                        alternate: feed("feed>link").attr('href'),
                        author: {
                            name: feed("feed>author>name").text(),
                            uri: feed("feed>author>uri").text(),
                        },
                        published: new Date(feed("feed>published").text()),
                        Videos: feed("feed>entry").map(
                            (i, el): Video => {
                                return {
                                    id: feed("id", el).text(),
                                    videoId: feed("yt\\:videoId", el).text(),
                                    channelId: feed("yt\\:channelId", el).text(),
                                    title: feed("title", el).text(),
                                    alternate: feed("link", el).attr("href"),
                                    author: {
                                        name: feed("author>name", el).text(),
                                        uri: feed("author>uri", el).text(),
                                    },
                                    published: new Date(feed("published", el).text()),
                                    updated: new Date(feed("updated", el).text()),
                                    thumbnail: feed("media\\:thumbnail", el).attr("url"),
                                    description: feed("media\\:description", el).text(),
                                    views: feed("media\\:statistics", el).attr("views"),
                                }
                            }
                        ).toArray(),
                    }
                )
            }
            
            return new Response(
                JSON.stringify(channels),
                {
                    headers: {
                        "content-type": "application/json;charset=UTF-8",
                        "access-control-allow-origin": "*",
                    }
                }
            )
        }
    )
    .all(
        "*",
        async () => {
            return new Response(
                "Not Found",
                { status: 404 }
            )
        }
    )

export default {
    fetch: router.handle
}