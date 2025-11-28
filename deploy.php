<?php
namespace Deployer;

require 'recipe/common.php';

// === プロジェクト設定 ===
set('application', 'Useful-Tools');
set('repository', 'git@github.com:Holmes-JP/Useful-Tools.git');
set('git_tty', false);
add('shared_files', ['.env']);

// === デプロイ先のホスト設定 ===
host('production')
    ->setHostname('57.181.246.229')
    ->setRemoteUser('ubuntu')
    ->setIdentityFile('/root/deploy_key')
    ->set('deploy_path', '/var/www/useful-tools');

// === ★追加: Composerインストールタスク ===
task('deploy:vendors', function () {
    run('cd {{release_path}} && composer install --verbose --prefer-dist --no-progress --no-interaction --optimize-autoloader');
});


// === タスク定義 ===
task('deploy', [
    'deploy:prepare',
    'deploy:update_code', // コードを持ってくる
    'deploy:vendors',     // ★ここでComposer installを実行！
    'deploy:shared',      // .envなどの共有リンク
    'deploy:publish',     // 公開（シンボリックリンク切り替え）
]);

after('deploy:failed', 'deploy:unlock');