from django.contrib import admin
from .models import ATLAS_rep,ATLAS_properties,ATLAS_paper,ATLAS_feedFile, RequestATLAS_user

# Register your models here.
    
@admin.register(ATLAS_paper)
class ATLAS_paperAdmin(admin.ModelAdmin):
      list_display = ('name_author','surname_author','short_ref','date',)

@admin.register(ATLAS_rep)
class ATLAS_repAdmin(admin.ModelAdmin):
      list_display = ('author','name_atlas','version',)


@admin.register(ATLAS_feedFile)
class ATLAS_feedFileAdmin(admin.ModelAdmin):
      list_display = ('feed','file',)
      
@admin.register(ATLAS_properties)
class ATLAS_propertiesAdmin(admin.ModelAdmin):
      list_display = ('author','atlas','coordinate','region','laterality','method','result','threshold',)
      list_filter = ('method', 'result','coordinate',)

@admin.register(RequestATLAS_user)
class ATLAS_RequestAdmin(admin.ModelAdmin):     
      list_display = ('requester','name_atlas','coordinate','region','laterality','method','result','threshold',)
 
'''
class FileInline(admin.TabularInline):
    model = File
class SetOfFilesAdmin(admin.ModelAdmin):
    list_display = ('name',)
    inlines = [FileInline]
'''
'''
class Atlas_rep_Admin(admin.ModelAdmin):
    Model = Atlas_rep
    list_display  = ('name')


admin.site.register(Atlas_rep,Atlas_rep_Admin) # to insert atlas db in admin page
'''
'''
class AddressAdmin(admin.ModelAdmin):
    fieldsets = [("User", {'fields': ['user_address']}),]
    readonly_fields = ['user_address']

    def user_address(self, obj):
        return obj.user.address
    user_address.short_description = 'User address'
'''
