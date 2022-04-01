//可以动态加载模块,可以加载远程链接

function load(path) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = path
        script.async = true
        document.head.appendChild(script)
        script.addEventListener('load', () => {
            let _lastRegister = lastRegister
            lastRegister = undefined
            if (!_lastRegister) {
                resolve([
                    [],
                    function () {}
                ]) //表示没有其他依赖了
            }
            resolve(_lastRegister)
        })
    })
}

function SystemJS() {

}
let set = new Set()
const saveGlobalPro = () => {
    for (let p in window) {
        set.add(p)
    }
}
const getGlobalLastPro = () => {
    let result;
    for (let p in window) {
        if (set.has(p)) continue;
        result = window[p]
        result.default = result
    }
    return result
}
saveGlobalPro()
/**
 @param id 本地路径
 @return 
*/
SystemJS.prototype.import = function (id) {
    return new Promise((resolve, reject) => {
        const lastSepIndex = window.location.href.lastIndexOf('/')
        let baseURL = location.href.slice(0, lastSepIndex + 1)
        if (id.startsWith('./')) {
            resolve(baseURL + id.slice(2))
        }
    }).then((id) => {
        //加载js文件 script 或 fetch + eval
        let exec;
        return load(id).then((registerition) => {
            function _export() {}
            let declare = registerition[1](_export)
            // 加载 react 和 react-dom 加载完毕后调用setters
            // 调用执行函数
            exec = declare.execute
            return [registerition[0], declare.setters]
        }).then((info) => {
            return Promise.all(info[0].map((dep, i) => {
                let setter = info[1][i]
                // console.log(dep);
                return load(dep).then(r => {
                    // console.log(r);
                    let p = getGlobalLastPro()
                    setter(p)
                })
            }))
        }).then(() => {
            exec()
        })
    })
}
let lastRegister;

/**
 @param deps 依赖列表
 @param declare 声明 （回调函数）
 @return 
*/
SystemJS.prototype.register = function (deps, declare) {
    //将本次注册的依赖和声明 暴露到外部
    lastRegister = [deps, declare]
    return
}
let System = new SystemJS();
System.import('./index.js').then((i) => {
    // console.log(i);
})