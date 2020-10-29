import smtplib


content = "example"
mail  =smtplib.SMTP('smtp.gmail.com:587')
mail.ehlo()
mail.starttls()
mail.login('atlasviewerapp@gmail.com','netstim2020')
mail.sendmail('atlasviewerapp@gmail.com','atlasviewerapp@gmail.com',content)
mail.close()