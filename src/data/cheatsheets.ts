import type { Cheatsheet } from "../lib/types.ts"

// Each row is [command, description, destructive?]. Use {{name=default}} for the parts
// a reader will want to change: those rows become editable in place.

const cheatsheets: Cheatsheet[] = [
  {
    id: "git-everyday",
    title: "Git: the everyday flow",
    summary: "From clone to push: the commands of a normal working day, in the order you use them.",
    groups: [
      {
        title: "Start",
        rows: [
          ["git clone {{url=git@github.com:user/project.git}}", "Copy a repository to your machine"],
          ["git init -b main", "Start a new repository in this directory"],
          ["git status -sb", "What has changed, in short form"],
        ],
      },
      {
        title: "Stage and commit",
        rows: [
          ["git add {{path=.}}", "Stage changes"],
          ["git add -p", "Stage changes piece by piece"],
          ["git diff --staged", "Review what is about to be committed"],
          ["git commit -m {{message=Describe the change}}", "Commit the staged changes"],
          ["git commit --amend --no-edit", "Add staged changes to the last commit"],
        ],
      },
      {
        title: "Branch",
        rows: [
          ["git switch -c {{branch=feature/login}}", "Create a branch and move to it"],
          ["git switch {{branch=main}}", "Move to an existing branch"],
          ["git switch -", "Go back to the previous branch"],
          ["git branch --sort=-committerdate", "List branches, most recent first"],
          ["git merge {{branch=feature/login}}", "Merge a branch into the current one"],
          ["git branch -d {{branch=feature/login}}", "Delete a branch that is merged"],
        ],
      },
      {
        title: "Sync",
        rows: [
          ["git fetch --prune", "Download new commits, drop deleted remote branches"],
          ["git pull --rebase", "Update your branch and replay local commits on top"],
          ["git push -u origin {{branch=feature/login}}", "Publish a branch for the first time"],
          ["git push", "Upload new commits"],
        ],
      },
      {
        title: "Inspect",
        rows: [
          ["git log --oneline --graph --all", "History of every branch as a graph"],
          ["git log -p -- {{file=src/app.js}}", "Every change ever made to one file"],
          ["git diff {{base=main}}...HEAD", "What your branch adds on top of its base"],
          ["git show {{commit=HEAD}}", "One commit in full"],
          ["git blame {{file=src/app.js}}", "Who last changed each line"],
        ],
      },
    ],
  },
  {
    id: "git-undo",
    title: "Git: undo almost anything",
    summary: "Pick the situation you are in. Lines with a warning sign throw work away.",
    groups: [
      {
        title: "Uncommitted changes",
        rows: [
          ["git restore --staged {{file=src/app.js}}", "Unstage a file, keep its changes"],
          ["git restore {{file=src/app.js}}", "Discard the changes in one file", true],
          ["git restore .", "Discard all unstaged changes", true],
          ["git stash push -u", "Put everything aside instead of discarding it"],
          ["git clean -nd", "Preview which untracked files would be deleted"],
          ["git clean -fd", "Delete untracked files and directories", true],
        ],
      },
      {
        title: "Commits you have not pushed",
        rows: [
          ["git commit --amend -m {{message=A better message}}", "Rewrite the last commit message"],
          ["git reset --soft HEAD~1", "Undo the last commit, keep the work staged"],
          ["git reset HEAD~1", "Undo the last commit, keep the work unstaged"],
          ["git reset --hard HEAD~1", "Drop the last commit and its changes", true],
          ["git rebase -i HEAD~{{count=3}}", "Edit, squash or drop recent commits"],
        ],
      },
      {
        title: "Commits already pushed",
        rows: [
          ["git revert {{commit=HEAD}}", "Reverse a commit with a new commit"],
          ["git revert -m 1 {{merge=a1b2c3d}}", "Reverse a merge commit"],
          ["git push --force-with-lease", "Replace the remote branch after rewriting history", true],
        ],
      },
      {
        title: "Recover",
        rows: [
          ["git reflog", "Find where HEAD pointed before things went wrong"],
          ["git reset --hard HEAD@{{{steps=1}}}", "Go back that many moves", true],
          ["git branch {{name=rescued}} {{commit=a1b2c3d}}", "Put a lost commit on a new branch"],
          ["git stash pop", "Bring back the last stash"],
          ["git merge --abort", "Back out of a merge in progress"],
          ["git rebase --abort", "Back out of a rebase in progress"],
        ],
      },
    ],
  },
  {
    id: "zsh-git",
    title: "Zsh: git aliases",
    summary: "The short forms from the Oh My Zsh git plugin, such as gst, gp, gswc and gcam, with the command each one runs.",
    groups: [
      {
        title: "Status and diff",
        rows: [
          ["gst", "git status"],
          ["gss", "git status --short"],
          ["gsb", "git status --short --branch"],
          ["gd", "git diff: unstaged changes"],
          ["gds", "git diff --staged: what is about to be committed"],
        ],
      },
      {
        title: "Stage and commit",
        rows: [
          ["ga {{path=.}}", "git add"],
          ["gaa", "git add --all"],
          ["gapa", "git add --patch: stage piece by piece"],
          ["gcmsg {{message=Fix login redirect}}", "git commit --message"],
          ["gcam {{message=Fix login redirect}}", "git commit --all --message: stage every tracked change and commit"],
          ["gc", "git commit --verbose: write the message in the editor"],
          ["gcn!", "git commit --verbose --no-edit --amend: add staged changes to the last commit"],
          ["gcan!", "git commit --verbose --all --no-edit --amend: add every tracked change to the last commit"],
        ],
      },
      {
        title: "Branches",
        rows: [
          ["gswc {{branch=feature/login}}", "git switch --create: create a branch and move to it"],
          ["gsw {{branch=main}}", "git switch: move to a branch"],
          ["gswm", "git switch to the main branch, whether it is called main or master"],
          ["gb", "git branch: list local branches"],
          ["gba", "git branch --all: local and remote branches"],
          ["gbd {{branch=feature/login}}", "git branch --delete: delete a merged branch"],
          ["gbD {{branch=feature/login}}", "git branch --delete --force: delete even if not merged", true],
          ["gco {{branch=main}}", "git checkout"],
          ["gcb {{branch=feature/login}}", "git checkout -b: the older way to create a branch"],
          ["gm {{branch=feature/login}}", "git merge"],
        ],
      },
      {
        title: "Sync",
        rows: [
          ["gf", "git fetch"],
          ["gfa", "git fetch --all --tags --prune"],
          ["gl", "git pull"],
          ["gpr", "git pull --rebase"],
          ["gp", "git push"],
          ["gpsup", "git push --set-upstream origin with the current branch: publish a new branch"],
          ["gpf", "git push --force-with-lease: overwrite the remote only if nobody pushed since you fetched", true],
          ["gpf!", "git push --force", true],
          ["grv", "git remote --verbose"],
        ],
      },
      {
        title: "History",
        rows: [
          ["glo", "git log --oneline --decorate"],
          ["glog", "git log --oneline --decorate --graph"],
          ["glola", "git log as a graph of every branch, with authors and dates"],
          ["gbl {{file=src/app.js}}", "git blame -w"],
        ],
      },
      {
        title: "Undo and stash",
        rows: [
          ["grs {{file=src/app.js}}", "git restore: drop unstaged changes to a file", true],
          ["grst {{file=src/app.js}}", "git restore --staged: unstage, keep the changes"],
          ["grh", "git reset: unstage everything"],
          ["grhh", "git reset --hard: throw away every uncommitted change", true],
          ["gsta", "git stash push"],
          ["gstp", "git stash pop"],
          ["gstl", "git stash list"],
          ["gwip", "Commit everything as a work-in-progress commit"],
          ["gunwip", "Undo the last gwip commit, keeping the changes"],
        ],
      },
      {
        title: "Rebase and cherry-pick",
        rows: [
          ["grb {{branch=main}}", "git rebase"],
          ["grbm", "git rebase onto the main branch"],
          ["grbi {{base=HEAD~3}}", "git rebase --interactive"],
          ["grbc", "git rebase --continue"],
          ["grba", "git rebase --abort"],
          ["gcp {{commit=a1b2c3d}}", "git cherry-pick"],
        ],
      },
      {
        title: "Set up and check",
        rows: [
          ["plugins=(git)", "In ~/.zshrc: turn on the git plugin, then open a new terminal"],
          ["alias | grep {{text=git}}", "List the aliases you have, to check what one runs"],
          ["which {{alias=gcam}}", "Show what one alias expands to"],
          ["grt", "cd to the top directory of the repository"],
        ],
      },
    ],
  },
  {
    id: "shell",
    title: "Shell essentials",
    summary: "Files, text, processes and disks: the lines you type on any Linux or macOS machine.",
    groups: [
      {
        title: "Files and directories",
        rows: [
          ["ls -lah", "List everything, with sizes you can read"],
          ["mkdir -p {{dir=src/components/ui}}", "Create a directory and its parents"],
          ["cp -a {{source=project}} {{dest=project.bak}}", "Copy a directory, keeping modes and times"],
          ["mv {{source=draft.txt}} {{dest=final.txt}}", "Rename or move"],
          ["ln -sfn {{target=/opt/app/releases/v2}} {{link=/opt/app/current}}", "Point a symbolic link at a new target"],
          ["rm -r {{path=build/}}", "Delete a directory and its contents", true],
        ],
      },
      {
        title: "Find and search",
        rows: [
          ["find . -name {{pattern=*.log}}", "Files by name, below here"],
          ["find . -type f -size +{{size=100M}}", "Files larger than a size"],
          ["find . -type f -mtime -{{days=1}}", "Files changed in the last days"],
          ["grep -rn {{text=TODO}} {{path=.}}", "Search file contents, with line numbers"],
          ["grep -rl {{text=TODO}} {{path=.}}", "Only the names of files that match"],
          ["history | grep {{text=ssh}}", "A command you typed before"],
        ],
      },
      {
        title: "Text",
        rows: [
          ["tail -f {{file=/var/log/syslog}}", "Follow a file as it grows"],
          ["head -n {{lines=20}} {{file=data.csv}}", "The first lines of a file"],
          ["wc -l {{file=data.csv}}", "Count lines"],
          ["sort {{file=names.txt}} | uniq -c | sort -rn", "Count duplicate lines, most frequent first"],
          ["cut -d, -f{{column=1}} {{file=data.csv}}", "One column of a CSV file"],
          ["sed -n '{{from=10}},{{to=20}}p' {{file=app.log}}", "Print a range of lines"],
          ["awk '{print ${{column=1}}}' {{file=access.log}}", "One whitespace-separated column"],
          ["diff -u {{old=a.txt}} {{new=b.txt}}", "Compare two files"],
        ],
      },
      {
        title: "Permissions",
        rows: [
          ["chmod +x {{file=deploy.sh}}", "Make a script executable"],
          ["chmod 600 {{file=~/.ssh/id_ed25519}}", "Readable and writable by you alone"],
          ["sudo chown -R {{owner=www-data:www-data}} {{path=/var/www/app}}", "Change owner and group of a tree"],
          ["id", "Your user, groups and IDs"],
        ],
      },
      {
        title: "Processes",
        rows: [
          ["ps aux --sort=-%mem | head", "Processes using the most memory"],
          ["pgrep -fl {{name=nginx}}", "Find processes by name"],
          ["kill {{pid=1234}}", "Ask a process to stop"],
          ["kill -9 {{pid=1234}}", "Stop it at once, without cleanup", true],
          ["nohup {{command=./long-job.sh}} > job.log 2>&1 &", "Keep a job running after you log out"],
          ["sudo systemctl restart {{service=nginx}}", "Restart a service"],
          ["journalctl -u {{service=nginx}} -f", "Follow the logs of a service"],
        ],
      },
      {
        title: "Disk and memory",
        rows: [
          ["df -h", "Free space per filesystem"],
          ["du -sh * | sort -h", "What takes the space in this directory"],
          ["free -h", "Memory in use and available"],
          ["uptime", "Load averages, and how long the machine has been up"],
        ],
      },
      {
        title: "Archives",
        rows: [
          ["tar -czf {{archive=backup.tar.gz}} {{path=project/}}", "Pack and compress"],
          ["tar -xf {{archive=backup.tar.gz}}", "Unpack"],
          ["tar -tf {{archive=backup.tar.gz}}", "List the contents"],
          ["zip -r {{archive=site.zip}} {{path=dist/}}", "Create a zip file"],
          ["unzip {{archive=site.zip}} -d {{dir=site/}}", "Extract a zip file"],
        ],
      },
    ],
  },
  {
    id: "zsh",
    title: "Zsh: shortcuts and shorthands",
    summary: "Keys that edit the command line, history tricks, and the zsh and Oh My Zsh shorthands that save typing.",
    groups: [
      {
        title: "Edit the line",
        rows: [
          ["Ctrl+A", "Jump to the start of the line"],
          ["Ctrl+E", "Jump to the end of the line"],
          ["Alt+B / Alt+F", "Back or forward one word"],
          ["Ctrl+W", "Delete the word before the cursor"],
          ["Ctrl+U", "Delete the whole line"],
          ["Ctrl+K", "Delete from the cursor to the end of the line"],
          ["Ctrl+Y", "Paste what you last deleted"],
          ["Ctrl+_", "Undo the last edit"],
          ["Ctrl+X Ctrl+E", "Open the line in your editor, run it when you save"],
          ["Ctrl+L", "Clear the screen, keep the line"],
          ["Ctrl+C", "Abandon the line or stop the running command"],
        ],
      },
      {
        title: "History",
        rows: [
          ["Ctrl+R", "Search history as you type. Press again for older matches"],
          ["Up / Down", "With text typed, step through history lines that start with it"],
          ["!!", "The previous command again"],
          ["sudo !!", "The previous command, with sudo"],
          ["!$", "The last argument of the previous command"],
          ["Alt+.", "Insert the last argument of the previous command. Repeat for older ones"],
          ["!{{text=ssh}}", "The most recent command that starts with this"],
          ["history | grep {{text=docker}}", "Search the full history"],
        ],
      },
      {
        title: "Directories",
        rows: [
          ["cd -", "Back to the previous directory"],
          ["..", "Up one level. Oh My Zsh also gives ... and ...."],
          ["d", "Oh My Zsh: the directories you visited, numbered"],
          ["{{n=2}}", "Oh My Zsh: jump to that numbered directory from d"],
          ["take {{dir=projects/new-app}}", "Oh My Zsh: create a directory and cd into it"],
          ["{{dir=~/projects}}", "Type a directory name alone to cd into it (setopt autocd)"],
        ],
      },
      {
        title: "Globs and expansion",
        rows: [
          ["ls **/*.{{ext=ts}}", "Files in every subdirectory, recursively"],
          ["ls *(.)", "Only plain files"],
          ["ls *(/)", "Only directories"],
          ["ls -l *(om[1,{{n=5}}])", "The newest files"],
          ["mkdir -p {{dir=src}}/{components,lib,pages}", "Several names in one go"],
          ["cp {{file=config.yml}}{,.bak}", "Copy a file to the same name plus .bak"],
        ],
      },
      {
        title: "Jobs",
        rows: [
          ["Ctrl+Z", "Pause the running command"],
          ["bg", "Keep it running in the background"],
          ["fg", "Bring it back to the front"],
          ["jobs", "List background jobs"],
        ],
      },
      {
        title: "Config",
        rows: [
          ["source ~/.zshrc", "Reload your config in this terminal"],
          ["alias {{name=ll}}='{{command=ls -lah}}'", "Add a shorthand of your own. Put it in ~/.zshrc to keep it"],
          ["alias", "List every alias"],
          ["bindkey", "List every key binding"],
        ],
      },
    ],
  },
  {
    id: "vim",
    title: "Vim essentials",
    summary: "Open, move, edit, search and save, and get out again. Everything after a colon is typed in normal mode.",
    groups: [
      {
        title: "Open, save, quit",
        rows: [
          ["vim {{file=notes.md}}", "Open a file"],
          ["vim +{{line=42}} {{file=app.py}}", "Open a file at a line"],
          [":w", "Save"],
          [":wq", "Save and quit. :x and ZZ do the same"],
          [":q", "Quit when nothing is unsaved"],
          [":q!", "Quit and throw away changes", true],
          [":w !sudo tee %", "Save a file you opened without sudo"],
          ["Esc", "Back to normal mode, from any mode"],
        ],
      },
      {
        title: "Move",
        rows: [
          ["h j k l", "Left, down, up, right"],
          ["w / b / e", "Next word, previous word, end of word"],
          ["0 / ^ / $", "Start of line, first character, end of line"],
          ["gg / G", "First line, last line"],
          [":{{line=42}}", "Go to a line. 42G does the same"],
          ["Ctrl+D / Ctrl+U", "Half a page down or up"],
          ["%", "Jump to the matching bracket"],
          ["f{{char=x}}", "Jump to the next x on this line. ; repeats"],
          ["Ctrl+O / Ctrl+I", "Back and forward through places you jumped to"],
        ],
      },
      {
        title: "Insert",
        rows: [
          ["i / a", "Insert before or after the cursor"],
          ["I / A", "Insert at the start or end of the line"],
          ["o / O", "New line below or above"],
        ],
      },
      {
        title: "Edit",
        rows: [
          ["x", "Delete the character under the cursor"],
          ["dd", "Delete (cut) the line"],
          ["dw", "Delete to the next word"],
          ["D", "Delete to the end of the line"],
          ["ciw", "Change the word under the cursor"],
          ["ci\"", "Change the text inside quotes. ci( and ci{ work too"],
          ["yy", "Copy (yank) the line"],
          ["p / P", "Paste after or before"],
          ["u / Ctrl+R", "Undo, redo"],
          [".", "Repeat the last change"],
          [">> / <<", "Indent or unindent the line"],
          ["J", "Join the next line onto this one"],
        ],
      },
      {
        title: "Search and replace",
        rows: [
          ["/{{pattern=TODO}}", "Search forward. ? searches backward"],
          ["n / N", "Next or previous match"],
          ["*", "Search for the word under the cursor"],
          [":%s/{{old=foo}}/{{new=bar}}/g", "Replace in the whole file"],
          [":%s/{{old=foo}}/{{new=bar}}/gc", "Replace, asking at each match"],
          [":noh", "Clear the search highlight"],
        ],
      },
      {
        title: "Visual mode",
        rows: [
          ["v", "Select characters"],
          ["V", "Select lines"],
          ["Ctrl+V", "Select a block (columns)"],
          ["y / d / >", "Copy, delete or indent the selection"],
          ["\"+y", "Copy the selection to the system clipboard"],
        ],
      },
      {
        title: "Windows and buffers",
        rows: [
          [":e {{file=README.md}}", "Open another file"],
          [":sp / :vsp", "Split horizontally or vertically"],
          ["Ctrl+W W", "Move to the next window"],
          [":ls", "List open buffers"],
          [":bn / :bp", "Next or previous buffer"],
        ],
      },
      {
        title: "Macros",
        rows: [
          ["q{{register=a}}", "Start recording into a register. q stops"],
          ["@{{register=a}}", "Play it back. @@ repeats the last one"],
          ["{{count=10}}@{{register=a}}", "Play it back that many times"],
        ],
      },
    ],
  },
  {
    id: "docker",
    title: "Docker: build, run, clean up",
    summary: "The container lifecycle on one page, including the commands that free disk space.",
    groups: [
      {
        title: "Images",
        rows: [
          ["docker build -t {{tag=myapp:latest}} .", "Build an image from the Dockerfile here"],
          ["docker images", "List local images"],
          ["docker pull {{image=nginx:alpine}}", "Download an image"],
          ["docker tag {{local=myapp:latest}} {{remote=registry.example.com/team/myapp:1.0.0}}", "Give an image a registry name"],
          ["docker push {{remote=registry.example.com/team/myapp:1.0.0}}", "Upload it"],
        ],
      },
      {
        title: "Run",
        rows: [
          ["docker run -d --name {{name=web}} -p {{ports=8080:80}} {{image=nginx:alpine}}", "Start in the background, with a published port"],
          ["docker run --rm -it {{image=ubuntu:24.04}} bash", "A throwaway interactive shell"],
          ["docker ps", "Running containers"],
          ["docker ps -a", "All containers, stopped ones included"],
          ["docker stop {{name=web}}", "Stop a container"],
          ["docker start {{name=web}}", "Start it again"],
        ],
      },
      {
        title: "Debug",
        rows: [
          ["docker logs -f --tail 100 {{name=web}}", "Follow the output"],
          ["docker exec -it {{name=web}} sh", "Open a shell inside"],
          ["docker inspect {{name=web}}", "Full configuration as JSON"],
          ["docker stats --no-stream", "CPU and memory per container"],
          ["docker cp {{name=web}}:{{path=/etc/nginx/nginx.conf}} .", "Copy a file out of a container"],
        ],
      },
      {
        title: "Compose",
        rows: [
          ["docker compose up -d", "Start every service in the background"],
          ["docker compose up -d --build", "Rebuild images, then start"],
          ["docker compose ps", "Status of the services"],
          ["docker compose logs -f {{service=api}}", "Follow one service"],
          ["docker compose exec {{service=api}} sh", "A shell in a running service"],
          ["docker compose down", "Stop and remove containers and networks"],
          ["docker compose down -v", "The same, and delete the volumes", true],
        ],
      },
      {
        title: "Clean up",
        rows: [
          ["docker system df", "What is using disk space"],
          ["docker container prune", "Remove stopped containers"],
          ["docker image prune -a", "Remove images that no container uses", true],
          ["docker volume prune", "Remove unused volumes and their data", true],
          ["docker system prune -a --volumes", "Remove everything unused", true],
        ],
      },
    ],
  },
  {
    id: "kubectl",
    title: "kubectl: day to day",
    summary: "Check your context, look at what runs, find out why it does not, roll out a change.",
    groups: [
      {
        title: "Where am I",
        rows: [
          ["kubectl config current-context", "The cluster you are talking to"],
          ["kubectl config get-contexts", "All contexts"],
          ["kubectl config use-context {{context=staging}}", "Switch cluster"],
          ["kubectl config set-context --current --namespace={{namespace=staging}}", "Set the default namespace"],
        ],
      },
      {
        title: "Look",
        rows: [
          ["kubectl get pods -o wide", "Pods, with node and IP"],
          ["kubectl get pods -A", "Pods in every namespace"],
          ["kubectl get deploy,svc,ingress", "The usual three kinds at once"],
          ["kubectl get events --sort-by=.lastTimestamp", "What happened recently"],
          ["kubectl top pods", "CPU and memory per pod"],
        ],
      },
      {
        title: "Debug",
        rows: [
          ["kubectl describe pod {{pod=web-7d4b9c6f5-x2k8p}}", "Details and events of a pod"],
          ["kubectl logs -f {{target=deploy/web}}", "Follow the logs"],
          ["kubectl logs {{pod=web-7d4b9c6f5-x2k8p}} --previous", "Logs of the run that crashed"],
          ["kubectl exec -it {{target=deploy/web}} -- sh", "A shell inside the container"],
          ["kubectl port-forward {{target=svc/web}} {{local=8080}}:{{remote=80}}", "Reach it on a local port"],
          ["kubectl run debug --rm -it --image=busybox:1.36 --restart=Never -- sh", "A temporary pod to test from inside"],
        ],
      },
      {
        title: "Deploy",
        rows: [
          ["kubectl diff -f {{path=k8s/}}", "What applying would change"],
          ["kubectl apply -f {{path=k8s/}}", "Apply the manifests"],
          ["kubectl rollout status {{target=deployment/web}}", "Wait for the rollout to finish"],
          ["kubectl rollout restart {{target=deployment/web}}", "Replace all pods gradually"],
          ["kubectl rollout undo {{target=deployment/web}}", "Go back to the previous version"],
          ["kubectl scale {{target=deployment/web}} --replicas={{replicas=3}}", "Change the number of pods"],
        ],
      },
      {
        title: "Remove",
        rows: [
          ["kubectl delete pod {{pod=web-7d4b9c6f5-x2k8p}}", "Delete a pod. Its deployment starts a new one"],
          ["kubectl delete -f {{path=k8s/}}", "Delete everything a manifest defines", true],
          ["kubectl delete namespace {{namespace=staging}}", "Delete a namespace and all it contains", true],
        ],
      },
    ],
  },
  {
    id: "ssh",
    title: "SSH: keys, copies, tunnels",
    summary: "Set up key login once, then move files and reach private services through the same connection.",
    groups: [
      {
        title: "Keys",
        rows: [
          ["ssh-keygen -t ed25519 -C {{comment=you@example.com}}", "Create a key pair"],
          ["ssh-copy-id {{user=deploy}}@{{host=example.com}}", "Install your public key on a server"],
          ["ssh-add {{key=~/.ssh/id_ed25519}}", "Load a key into the agent"],
          ["ssh-add -l", "Keys the agent holds"],
          ["cat {{key=~/.ssh/id_ed25519.pub}}", "Print the public key, to paste somewhere"],
          ["ssh-keygen -R {{host=example.com}}", "Forget a server whose host key changed"],
        ],
      },
      {
        title: "Connect",
        rows: [
          ["ssh {{user=deploy}}@{{host=example.com}}", "Open a shell"],
          ["ssh -p {{port=2222}} {{user=deploy}}@{{host=example.com}}", "On another port"],
          ["ssh {{user=deploy}}@{{host=example.com}} {{command=uptime}}", "Run one command and return"],
          ["ssh -J {{jump=deploy@bastion.example.com}} {{target=deploy@10.0.1.20}}", "Through a jump host"],
          ["ssh -v {{user=deploy}}@{{host=example.com}}", "See why a login fails"],
        ],
      },
      {
        title: "Copy files",
        rows: [
          ["scp {{file=app.tar.gz}} {{user=deploy}}@{{host=example.com}}:{{path=/var/www/}}", "Upload a file"],
          ["scp {{user=deploy}}@{{host=example.com}}:{{path=/var/log/nginx/error.log}} .", "Download a file"],
          ["rsync -avz {{source=./dist/}} {{user=deploy}}@{{host=example.com}}:{{path=/var/www/app/}}", "Sync a directory, sending only changes"],
          ["rsync -avzn --delete {{source=./dist/}} {{user=deploy}}@{{host=example.com}}:{{path=/var/www/app/}}", "Preview an exact mirror, without changing anything"],
        ],
      },
      {
        title: "Tunnels",
        rows: [
          ["ssh -N -L {{local=5432}}:localhost:{{remote=5432}} {{user=deploy}}@{{host=db.example.com}}", "Use a remote service on a local port"],
          ["ssh -N -R {{remote=8080}}:localhost:{{local=3000}} {{user=deploy}}@{{host=example.com}}", "Expose a local service on the server"],
          ["ssh -N -D {{port=1080}} {{user=deploy}}@{{host=example.com}}", "A SOCKS proxy through the server"],
        ],
      },
    ],
  },
  {
    id: "network-debug",
    title: "Is it the network?",
    summary: "A checklist for when a service cannot be reached. Work down the page until one answer is wrong.",
    groups: [
      {
        title: "Does the name resolve",
        rows: [
          ["dig {{host=example.com}} +short", "The addresses your resolver returns"],
          ["dig @1.1.1.1 {{host=example.com}} +short", "The same, from a public resolver"],
          ["dig {{host=example.com}} NS +short", "Which name servers are responsible"],
          ["getent hosts {{host=example.com}}", "What this machine resolves, hosts file included"],
        ],
      },
      {
        title: "Is the host reachable",
        rows: [
          ["ping -c 4 {{host=example.com}}", "Does it answer, and how fast"],
          ["traceroute -n {{host=example.com}}", "Where on the way packets stop"],
          ["ip route get {{address=1.1.1.1}}", "Which interface and gateway are used"],
        ],
      },
      {
        title: "Is the port open",
        rows: [
          ["nc -zv -w 3 {{host=example.com}} {{port=443}}", "Can I connect to that port from here"],
          ["sudo ss -ltnp", "On the server: what listens, and on which address"],
          ["sudo ufw status numbered", "On the server: what the firewall allows"],
          ["sudo tcpdump -i any -n port {{port=443}}", "On the server: do the packets arrive at all"],
        ],
      },
      {
        title: "What does the service say",
        rows: [
          ["curl -sS -o /dev/null -w '%{http_code}\\n' {{url=https://example.com}}", "Only the HTTP status code"],
          ["curl -I {{url=https://example.com}}", "The response headers"],
          ["curl -v {{url=https://example.com}}", "The whole exchange, with the TLS handshake"],
          ["curl --resolve {{host=example.com}}:443:{{address=203.0.113.10}} https://{{host=example.com}}", "Test one server directly, ignoring DNS"],
        ],
      },
    ],
  },
  {
    id: "postgres",
    title: "PostgreSQL: psql and backups",
    summary: "Connect, look around, back up and restore, and find the query that is in the way.",
    groups: [
      {
        title: "Connect",
        rows: [
          ["psql -h {{host=localhost}} -U {{user=postgres}} -d {{database=app}}", "Open a prompt"],
          ["psql -d {{database=app}} -c {{sql=SELECT now();}}", "Run one statement"],
          ["psql -d {{database=app}} -f {{file=schema.sql}}", "Run a SQL file"],
          ["createdb -U {{user=postgres}} {{database=app}}", "Create a database"],
        ],
      },
      {
        title: "Inside psql",
        rows: [
          ["\\l", "List databases"],
          ["\\c {{database=app}}", "Switch database"],
          ["\\dt", "List tables"],
          ["\\d {{table=users}}", "Columns, indexes and constraints of a table"],
          ["\\du", "List roles"],
          ["\\x", "Toggle one column per line, for wide rows"],
          ["\\timing", "Show how long each statement takes"],
        ],
      },
      {
        title: "Back up and restore",
        rows: [
          ["pg_dump -U {{user=postgres}} -d {{database=app}} -Fc -f {{file=app.dump}}", "Back up one database, compressed"],
          ["pg_restore -U {{user=postgres}} -d {{database=app}} {{file=app.dump}}", "Restore it into an existing database"],
          ["pg_dump -d {{database=app}} -s -f {{file=schema.sql}}", "Only the structure"],
          ["pg_dumpall -U {{user=postgres}} -f {{file=cluster.sql}}", "Every database and all roles"],
        ],
      },
      {
        title: "Find the problem",
        rows: [
          ["psql -d {{database=app}} -c \"SELECT pid, state, now() - query_start AS runtime, left(query, 60) FROM pg_stat_activity WHERE state <> 'idle' ORDER BY runtime DESC;\"", "What is running, longest first"],
          ["psql -d {{database=app}} -c 'SELECT pg_cancel_backend({{pid=12345}});'", "Ask a query to stop"],
          ["psql -d {{database=app}} -c 'SELECT pg_size_pretty(pg_database_size(current_database()));'", "Size of the database"],
          ["psql -d {{database=app}} -c 'VACUUM (ANALYZE);'", "Reclaim space and refresh planner statistics"],
        ],
      },
    ],
  },
]

export default cheatsheets
