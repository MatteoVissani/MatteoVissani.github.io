# setup for using django models outside

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "atlas_dbs.settings")
django.setup()

# script start from here

import zipfile
from pkg_resources import resource_filename
from nilearn.image import crop_img
from ATLAS.models import ATLAS_rep, ATLAS_properties,ATLAS_feedFile
import nibabel as nb
from nilearn import image, plotting
from nilearn.regions import connected_regions
from nilearn._utils import check_niimg
from sklearn.utils import Bunch
import pandas as pd
import numpy as np
# get one atlas now

# use for db
#atlas = ATLAS_feedFile.objects.get(id=1)
#atlas_path  = atlas.file.path
#atlas_type  = str(atlas.feed)





def check_coord_inputs(coords):
    """
    Confirms `coords` are appropriate shape for coordinate transform
    Parameters
    ----------
    coords : array-like
    Returns
    -------
    coords : (4 x N) numpy.ndarray
    """
    coords = np.atleast_2d(coords).T
    if 3 not in coords.shape:
        raise ValueError('Input coordinates must be of shape (3 x N). '
                         'Provided coordinate shape: {}'.format(coords.shape))
    if coords.shape[0] != 3:
        coords = coords.T
    # add constant term to coords to make 4 x N
    coords = np.row_stack([coords, np.ones_like(coords[0])])
    print(coords)
    return coords


def coord_ijk_to_xyz(affine, coords):
    """
    Converts voxel `coords` in cartesian space to `affine` space
    Parameters
    ----------
    affine : (4, 4) array-like
        Affine matrix
    coords : (N,) list of list
        Image coordinate values, where each entry is a length three list of int
        denoting ijk coordinates in cartesian space
    Returns
    ------
    xyz : (N, 3) numpy.ndarray
        Provided `coords` in `affine` space
    """
    coords = check_coord_inputs(coords)
    mni_coords = np.dot(affine, coords)[:3].T
    return mni_coords


def coord_xyz_to_ijk(affine, coords):
    """
    Converts voxel `coords` in `affine` space to cartesian space
    Parameters
    ----------
    affine : (4, 4) array-like
        Affine matrix
    coords : (N,) list of list
        Image coordinate values, where each entry is a length three list of int
        denoting xyz coordinates in `affine` space
    Returns
    ------
    ijk : (N, 3) numpy.ndarray
        Provided `coords` in cartesian space
    """
    coords = check_coord_inputs(coords)
    vox_coords = np.linalg.solve(affine, coords)[:3].T
    vox_coords = np.round(vox_coords).astype(int)
    return vox_coords





def check_atlas_bounding_box(voxIDs, box_shape):
    """
    Returns the provided voxel ID if the voxel is inside the bounding box of
    the atlas image, otherwise the voxel ID will be replaced with the origin.
    Parameters
    ----------
    voxIDs : (N, 3) numpy.ndarray
        `coords` in cartesian space
    box_shape : (3,) list of int
        size of the atlas bounding box
    Returns
    ------
    ijk : (N, 3) numpy.ndarray
        `coords` in cartesian space that are inside the bounding box
    """

    # Detect voxels that are outside the atlas bounding box
    vox_outside_box = np.sum(
        (voxIDs < 0) + (voxIDs >= box_shape[:3]), axis=-1, dtype='bool')

    # Set those voxels to the origin (i.e. a voxel outside the brain)
    voxIDs[vox_outside_box] = np.zeros(3, dtype='int')

    return voxIDs


def get_label(atlastype, label_id):
    """
    Gets anatomical name of `label_id` in `atlastype`
    Parameters
    ----------
    atlastype : str
        Name of atlas to use
    label_id : int
        Numerical ID representing label
    Returns
    ------
    label : str
        Neuroanatomical region of `label_id` in `atlastype`
    """
    labels = check_atlases(atlastype).labels
    try:
        return labels.query('index == {}'.format(label_id)).name.iloc[0]
    except IndexError:
        return 'no_label'


# use the following two lines if you want to avoid django
atlas_path = r"C:\Users\matte\Documents\GitHub\ATLAS-DBS-PRoject\atlas_dbs\media\atlases\AICHA v. 1.0 (Joliot et al)/AICHA_nuclei_Joliot_2015_prova.nii.gz"

# Load atlas and crop image
img = crop_img(atlas_path)

    # Get data array
data = img.get_fdata()

    # Decide which datatype to use
if data.max() <= 255 and data.min() >= 0:
   dtype = '>u1'
elif data.max() <= 65535 and data.min() >= 0:
    dtype = '>u2'
else:
    dtype = 'i2'

    # Create a new image with the correct datatype
img.set_data_dtype(dtype)
new_img = nb.Nifti1Image(
        data.astype(dtype), affine=img.affine, header=img.header)

    # Change the compression level of the NIfTI image
nb.openers.Opener.default_compresslevel = 6

    # Overwrite previous atlas file with new image
new_fname = atlas_path.replace('.nii.gz', 'compr.nii.gz')
new_img.to_filename(new_fname)






atlas_path = r"C:\Users\matte\Documents\GitHub\ATLAS-DBS-PRoject\atlas_dbs\media\atlases\AICHA v. 1.0 (Joliot et al)/AICHA_nuclei_Joliot_2015_provacompr.nii.gz"


atlas_type = 'AICHA'


label_path = r"C:\Users\matte\Documents\GitHub\ATLAS-DBS-PRoject\atlas_dbs\media\atlases\AICHA v. 1.0 (Joliot et al)\labels.txt"

print('atlas type :', atlas_type)
print('atlas path :', atlas_path)

atlas_checked = Bunch(atlas=atlas_type,
                image=nb.load(atlas_path),
                labels=pd.read_csv(label_path, sep=",",skiprows=1, header=None, names = ['index','name']))

print(atlas_checked.labels['index'])
print(atlas_checked.labels['name'])

# set cache
data = atlas_checked.image.get_fdata()

# get affine
atlas_checked.image.affine

coords = [-35, 9, -33]
print(coords)

# get voxel index
voxIJK = coord_xyz_to_ijk(atlas_checked.image.affine, coords).squeeze()
print('see if it outside brain:')
print(voxIJK)
voxIJK = check_atlas_bounding_box(voxIJK, data.shape)
print(voxIJK)


probs = data[voxIJK[0], voxIJK[1], voxIJK[2]]
print(probs)

label = atlas_checked.labels.query('index == {}'.format(probs)).name.iloc[0]
print(label)

print(atlas_checked.image.affine)

'''
# get label information
    # probabilistic atlas is requested
    if atlastype.atlas.lower() in ['juelich', 'harvard_oxford']:
        probs = data[voxID[0], voxID[1], voxID[2]]
        probs[probs < prob_thresh] = 0
        idx, = np.where(probs)

        # if no labels found
        if len(idx) == 0:
            return [[0, 'no_label']]

        # sort list by probability
        idx = idx[np.argsort(probs[idx])][::-1]

        # get probability and label names
        probLabel = [[probs[i], get_label(atlastype, i)] for i in idx]

        return probLabel
    # non-probabilistic atlas is requested
    else:
        labelID = int(data[voxID[0], voxID[1], voxID[2]])
        label = get_label(atlastype, labelID)
        return label
'''






