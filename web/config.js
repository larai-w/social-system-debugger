// config.js — 環境依存の設定を1か所に集約（ロジックと分離）。
// scenario.js より前に読み込む。ここだけ差し替えれば良く、コード本体は触らない。
//
// contentBaseUrl: 週替わりシナリオ配信元（CloudFront の …/content/weekly）。
//   ・空文字なら相対パス 'content/weekly' にフォールバック（Web/AWS 同一オリジン配信時）。
//   ・ネイティブアプリで配信版を取得したい場合はここに CloudFront の絶対URLを設定。
//   ・AWS デプロイ時は deploy-aws.yml が Variable CLOUDFRONT_DOMAIN からこのファイルを
//     自動生成するため、手でコミットする必要はない（未設定なら空のまま＝バンドル版で動作）。
window.SSD_CONFIG = {
  contentBaseUrl: ""
};
