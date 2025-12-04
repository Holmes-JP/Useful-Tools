import { useState } from 'react';
import yaml from 'js-yaml';
import jwt_decode from 'jwt-decode';

export default function WebToolsPanel(){
    const [jsonInput, setJsonInput] = useState('');
    const [yamlInput, setYamlInput] = useState('');
    const [jwtInput, setJwtInput] = useState('');
    const [jwtPayload, setJwtPayload] = useState<any>(null);
    const [regexPattern, setRegexPattern] = useState('');
    const [regexFlags, setRegexFlags] = useState('g');
    const [regexTarget, setRegexTarget] = useState('');
    const [regexMatches, setRegexMatches] = useState<string[] | null>(null);

    function jsonToYaml(){
        try {
            const obj = JSON.parse(jsonInput);
            setYamlInput(yaml.dump(obj));
        } catch (e: any) {
            alert('Invalid JSON: ' + e.message);
        }
    }

    function yamlToJson(){
        try {
            const obj = yaml.load(yamlInput);
            setJsonInput(JSON.stringify(obj, null, 2));
        } catch (e: any) {
            alert('Invalid YAML: ' + e.message);
        }
    }

    function decodeJwt(){
        try {
            const p = jwt_decode(jwtInput);
            setJwtPayload(p);
        } catch (e: any){
            alert('Invalid JWT');
        }
    }

    function testRegex(){
        try{
            const re = new RegExp(regexPattern, regexFlags);
            const m = Array.from(regexTarget.matchAll(re)).map(x => x[0]);
            setRegexMatches(m);
        }catch(e:any){
            alert('Invalid regex');
            setRegexMatches(null);
        }
    }

    return (
        <div className="space-y-6">
            <section>
                <h4 className="text-lg font-semibold text-white">JSON ⇄ YAML</h4>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <textarea className="w-full bg-gray-800 p-2 rounded" rows={8} value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder='JSON here' />
                        <div className="flex gap-2 mt-2">
                            <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={jsonToYaml}>→ YAML</button>
                        </div>
                    </div>
                    <div>
                        <textarea className="w-full bg-gray-800 p-2 rounded" rows={8} value={yamlInput} onChange={e=>setYamlInput(e.target.value)} placeholder='YAML here' />
                        <div className="flex gap-2 mt-2">
                            <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={yamlToJson}>→ JSON</button>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-lg font-semibold text-white">JWT Decoder</h4>
                <div className="mt-2">
                    <input className="w-full bg-gray-800 p-2 rounded" value={jwtInput} onChange={e=>setJwtInput(e.target.value)} placeholder='Paste JWT here' />
                    <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={decodeJwt}>Decode</button>
                        <pre className="bg-gray-900 p-2 rounded text-sm overflow-auto flex-1">{jwtPayload ? JSON.stringify(jwtPayload, null, 2) : 'No payload'}</pre>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-lg font-semibold text-white">Regex Tester</h4>
                <div className="mt-2 space-y-2">
                    <input className="w-full bg-gray-800 p-2 rounded" placeholder="pattern" value={regexPattern} onChange={e=>setRegexPattern(e.target.value)} />
                    <div className="flex gap-2">
                        <input className="bg-gray-800 p-2 rounded" value={regexFlags} onChange={e=>setRegexFlags(e.target.value)} style={{width:120}} />
                        <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={testRegex}>Test</button>
                    </div>
                    <textarea className="w-full bg-gray-800 p-2 rounded" rows={4} value={regexTarget} onChange={e=>setRegexTarget(e.target.value)} placeholder='Target text' />
                    <div>Matches: {regexMatches ? regexMatches.length : 0}</div>
                    <pre className="bg-gray-900 p-2 rounded text-sm overflow-auto">{regexMatches ? JSON.stringify(regexMatches, null, 2) : 'No matches'}</pre>
                </div>
            </section>
        </div>
    );
}
