require('dotenv').config({ path: '../.env' });
const db = require('../db');
const fs = require('fs');

async function testApi() {
    try {
        const allLinksRes = await db.query(`
      SELECT r.referrer_code, r.referred_code, r.created_at, u.name as referred_name
      FROM "Referral" r
      JOIN "User" u ON r.referred_code = u.referral_code
      WHERE r.level = 1
      ORDER BY r.created_at ASC
    `);

        const childrenMap = {};
        for (const row of allLinksRes.rows) {
            if (!childrenMap[row.referrer_code]) {
                childrenMap[row.referrer_code] = [];
            }
            childrenMap[row.referrer_code].push({
                name: row.referred_name,
                referralCode: row.referred_code
            });
        }

        const buildTreeMem = (referralCode, userName) => {
            const node = {
                name: userName,
                referralCode: referralCode,
                children: []
            };

            const directChildren = childrenMap[referralCode] || [];
            for (const child of directChildren) {
                node.children.push(buildTreeMem(child.referralCode, child.name));
            }

            return node;
        };

        const tree = buildTreeMem('MAX07725', 'Om saravana');
        fs.writeFileSync('api_tree_dump.json', JSON.stringify(tree, null, 2));

        // Check if Latha is in the tree
        const foundCodes = new Set();
        const mapTree = (node) => {
            foundCodes.add(node.referralCode);
            node.children.forEach(mapTree);
        };
        mapTree(tree);

        console.log("Total nodes in tree:", foundCodes.size);
        console.log("Is Latha (MAX49634) in tree?", foundCodes.has('MAX49634'));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
testApi();
