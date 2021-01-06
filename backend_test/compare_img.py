import zipfile
from pkg_resources import resource_filename
from nilearn.image import crop_img
import nibabel as nb
from nilearn import image, plotting
from nilearn.regions import connected_regions
from nilearn._utils import check_niimg
from sklearn.utils import Bunch
import pandas as pd
import numpy as np

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




atlas_path_compr = r"C:\Users\matte\MatteoV Dropbox\Matteo Vissani\ToolBox\spm12\toolbox\AICHA\AICHAmc_compr.nii.gz"

atlas_path_aicha = r"C:\Users\matte\Documents\GitHub\ATLAS-DBS-PRoject\atlas_dbs\media\atlases\AICHA v. 1.0 (Joliot et al)/atlas_aicha.nii.gz"


at_compr = nb.load(atlas_path_compr)
at_aicha = nb.load(atlas_path_aicha)


data_compr = at_compr.get_fdata()
data_aicha = at_aicha.get_fdata()

cc = [48,-26,43]

# get voxel index
voxIJK_compr = coord_xyz_to_ijk(at_compr.affine, cc).squeeze()
print('see if it outside brain:')
voxIJK_compr = check_atlas_bounding_box(voxIJK_compr, data_compr.shape)
print('voxel data_compr: ',voxIJK_compr)
print('affine compr:',at_compr.affine, )
voxIJK_aicha= coord_xyz_to_ijk(at_aicha.affine, cc).squeeze()
print('see if it outside brain:')
voxIJK_aicha = check_atlas_bounding_box(voxIJK_aicha, at_aicha.shape)
print('voxel data_aicha: ',voxIJK_aicha)
print('affine aicha:',at_aicha.affine, )





print('value data_compr: ',data_compr[voxIJK_compr[0],voxIJK_compr[1],voxIJK_compr[2]])
print('shape data_compr: ',data_compr.shape)

print('value data_aicha: ',data_aicha[voxIJK_aicha[0],voxIJK_aicha[1],voxIJK_aicha[2]])
print('shape data_compr: ',data_aicha.shape)

label_path = r"C:\Users\matte\Documents\GitHub\ATLAS-DBS-PRoject\atlas_dbs\media\atlases\AICHA v. 1.0 (Joliot et al)\labels.txt"
labels=pd.read_csv(label_path, sep=",",skiprows=1, header=None, names = ['index','name'])

label = labels.query('index == {}'.format(data_compr[voxIJK_compr[0],voxIJK_compr[1],voxIJK_compr[2]])).name.iloc[0]
print(label)
label = labels.query('index == {}'.format(data_aicha[voxIJK_aicha[0],voxIJK_aicha[1],voxIJK_aicha[2]])).name.iloc[0]
print(label)
