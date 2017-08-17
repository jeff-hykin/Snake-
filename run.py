import os
import sh
import regex as re
import webbrowser



# gets the current directory and removes the newline from the end
directory_ = str(sh.pwd())[0:-1]

# list of files/folders
command_output = str(sh.ls('-1'))
file_names = re.findall(r'(.+)\n',command_output)

# check the directory, make sure its in the Mac's apache server directory
if re.match(r'/Library/WebServer/Documents/', directory_) == None:
    print "\n\n\n\nI don't think you're in the right directory"
    print "to run web stuff, the project needs to be in:"
    print "Library/WebServer/Documents"
    exit(1)
    
# figure out/create the url based on the current directory
remaining_dir = re.sub(r'^/Library/WebServer/Documents/','',directory_)
url_ = 'http://localhost/' + remaining_dir + '/index.html'


# make sure apache_is_running 
if True:
    apache_is_running = False
    # list all the processes, only show the command column, convert them to a big string 
    all_processes = str(sh.ps('ax', '-o', 'command'))
    # split up the string into a list of lines 
    all_processes = all_processes.splitlines()
    # check each line for /usr/sbin/httpd 
        # Note:
        # this isn't foolproof but for the most part 
        # only the apache process will include /usr/sbin/httpd in its command
    for each in all_processes:
        # if you find it, then apache is probably running
        if re.search(r'/usr/sbin/httpd', each):
            apache_is_running = True
    
    # if apache is not running, then try to start it
    if not apache_is_running:
        print "\n\n\n\nHey I think apache isn't running"
        print "It might take a second to start "
        print "and it can be started from here with your password"
        os.system('sudo apachectl start')



# convert .pug and .sass files to .html and .css
if True:
    # check for pug file
    if True:
        # if no pug file, then give an error 
        if 'index.pug' not in file_names:
                print "\n\n\n\nI'm looking for an index.pug file but I don't see one"
                print "to fix this, either dont use this run.py or create an index.pug"
                exit(1)
        # otherwise convert the pug file
        else:
            os.system("pug -P index.pug")
    # check for sass file 
    if True:
        # if no sass file, then give an error 
        if 'main.sass' not in file_names:
            print "\n\n\n\nI'm looking for an main.sass file but I don't see one"
            print "to fix this, either dont use this run.py or create an main.sass"
            exit(1)
        # otherwise convert the sass file
        else:
            os.system("sass main.sass main.css")


# open the url in the default browser
webbrowser.open(url_)
# print the url for copy-pasting to other browsers
print url_
